import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { BulkUser } from "./types";
import { userApi } from "@/services/userApi";
import { userGroupsApi } from "@/services/userGroupsApi";
import {
    createRealmEmailDomainValidator,
    deriveUsername,
    getUserCreationValidation,
    toUserFriendlyCreationError,
} from "./userCreationValidation";

interface BulkImportModalProps {
    realm: string;
    initialBulkUsers: BulkUser[];
    onClose: () => void;
    onBulkCreated: () => void;
}

export function BulkImportModal({
    realm,
    initialBulkUsers,
    onClose,
    onBulkCreated,
}: Readonly<BulkImportModalProps>) {
    const [bulkUsers, setBulkUsers] = useState<BulkUser[]>(initialBulkUsers);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    const handleBulkCreate = async () => {
        if (!realm) return;
        setIsBulkLoading(true);
        const updated = bulkUsers.map((user) => {
            const { normalized } = getUserCreationValidation(user);
            return {
                ...user,
                ...normalized,
            };
        });
        const validateEmailDomainAgainstRealm = createRealmEmailDomainValidator(realm);

        for (let i = 0; i < updated.length; i++) {
            const row = updated[i];
            if (row.status !== "pending") continue;

            const { nameError, emailError, usernameError, roleError, normalized } = getUserCreationValidation(row);
            const validationMessage = nameError || emailError || usernameError || roleError;
            if (validationMessage) {
                updated[i] = { ...row, status: `Validation failed: ${validationMessage}` };
                continue;
            }

            const emailDomainError = await validateEmailDomainAgainstRealm(normalized.email);
            if (emailDomainError) {
                updated[i] = { ...row, status: `Validation failed: ${emailDomainError}` };
                continue;
            }

            updated[i] = { ...row, ...normalized, username: deriveUsername(normalized.email, normalized.username) };
        }

        setBulkUsers([...updated]);

        // Build group map and ensure groups exist up front for valid rows only
        const groupNames = new Set<string>();
        updated.forEach((u) => {
            if (u.status === "pending" && u.groups && Array.isArray(u.groups)) {
                u.groups.filter(Boolean).forEach((g) => groupNames.add(g.trim()));
            }
        });

        const groupIdMap: Record<string, string> = {};
        const fetchGroupsIds = async () => {
            try {
                const data = await userGroupsApi.getGroups(realm);
                (data.groups || []).forEach((g: any) => {
                    if (g.name && g.id) groupIdMap[g.name] = g.id;
                });
            } catch { /* ignore */ }
        };

        await fetchGroupsIds();

        for (const name of groupNames) {
            if (groupIdMap[name]) continue;
            try {
                await userGroupsApi.createGroup(realm, { name });
                await fetchGroupsIds();
            } catch { /* ignore */ }
        }

        const createdUsers: { email: string; groups: string[] }[] = [];

        for (let i = 0; i < updated.length; i++) {
            const u = updated[i];
            if (u.status !== "pending") continue;
            try {
                const data = await userApi.createUser(
                    realm,
                    {
                        username: deriveUsername(u.email, u.username),
                        name: u.name,
                        email: u.email,
                        role: u.role,
                    }
                );
                updated[i] = { ...u, status: `Created successfully. Temporary password: ${data?.temporary_password ?? "N/A"}` };
                if (u.groups?.length) createdUsers.push({ email: u.email, groups: u.groups });
            } catch (error) {
                updated[i] = { ...u, status: `Creation failed: ${toUserFriendlyCreationError(error)}` };
            }
        }

        // Assign groups
        try {
            const data = await userApi.getUsers(realm);
            const userMap: Record<string, string> = {};
            (data.users || []).forEach((usr: any) => {
                if (usr.email && usr.id) userMap[usr.email.toLowerCase()] = usr.id;
            });
            for (const entry of createdUsers) {
                const uid = userMap[entry.email.toLowerCase()];
                if (!uid) continue;
                for (const gName of entry.groups) {
                    const gid = groupIdMap[gName];
                    if (!gid) {
                        const rowIndex = updated.findIndex((user) => user.email === entry.email);
                        if (rowIndex >= 0) {
                            updated[rowIndex] = {
                                ...updated[rowIndex],
                                status: `Created, but group "${gName}" could not be found or created.`,
                            };
                        }
                        continue;
                    }
                    try {
                        await userGroupsApi.addUserToGroup(realm, gid, uid);
                    } catch {
                        const rowIndex = updated.findIndex((user) => user.email === entry.email);
                        if (rowIndex >= 0) {
                            updated[rowIndex] = {
                                ...updated[rowIndex],
                                status: `Created, but could not add all groups. Check group "${gName}".`,
                            };
                        }
                    }
                }
            }
        } catch { /* ignore */ }

        setBulkUsers(updated);
        setIsBulkLoading(false);
        onBulkCreated();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50 p-6">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-border">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-surface-subtle">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Bulk Import Users</h2>
                        <p className="text-sm text-muted-foreground">{bulkUsers.length} users imported from CSV</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted rounded-lg transition-all cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-muted-foreground border-b border-border">
                                <th className="pb-3 font-medium">Username</th>
                                <th className="pb-3 font-medium">Name</th>
                                <th className="pb-3 font-medium">Email</th>
                                <th className="pb-3 font-medium">Role</th>
                                <th className="pb-3 font-medium">Groups</th>
                                <th className="pb-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bulkUsers.map((u, i) => (
                                <tr key={i} className="border-b border-border/40 last:border-0">
                                    <td className="py-3 text-foreground">{u.username}</td>
                                    <td className="py-3 text-foreground/90">{u.name}</td>
                                    <td className="py-3 text-muted-foreground">{u.email}</td>
                                    <td className="py-3">
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                                            {u.role || "—"}
                                        </span>
                                    </td>
                                    <td className="py-3 text-muted-foreground">
                                        {u.groups && u.groups.length ? u.groups.join(", ") : "—"}
                                    </td>
                                    <td className="py-3">
                                        <span className={`text-xs ${u.status.startsWith("Created") ? "text-green-600" : u.status.includes("failed") || u.status.includes("could not") ? "text-rose-600" : "text-muted-foreground/70"}`}>
                                            {u.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 flex justify-end gap-3 border-t border-border/40 bg-surface-subtle">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xs text-[14px] font-medium text-muted-foreground bg-background hover:bg-muted transition-all border border-border cursor-pointer">
                        Close
                    </button>
                    <button
                        onClick={handleBulkCreate}
                        disabled={isBulkLoading || bulkUsers.every((u) => u.status !== "pending")}
                        className="px-6 py-2.5 rounded-xl text-[14px] font-medium text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25"
                    >
                        {isBulkLoading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                Creating...
                            </span>
                        ) : `Create ${bulkUsers.filter((u) => u.status === "pending").length} Users`}
                    </button>
                </div>
            </div>
        </div>
    );
}
