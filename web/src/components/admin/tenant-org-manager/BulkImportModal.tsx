import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";
import type { BulkUser } from "./types";

interface BulkImportModalProps {
    realm: string;
    initialBulkUsers: BulkUser[];
    onClose: () => void;
    onBulkCreated: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL;

export function BulkImportModal({
    realm,
    initialBulkUsers,
    onClose,
    onBulkCreated,
}: BulkImportModalProps) {
    const { keycloak } = useKeycloak();
    const [bulkUsers, setBulkUsers] = useState<BulkUser[]>(initialBulkUsers);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    const handleBulkCreate = async () => {
        if (!realm) return;
        setIsBulkLoading(true);
        const updated = [...bulkUsers];

        // Build group map and ensure groups exist up front
        const groupNames = new Set<string>();
        bulkUsers.forEach((u) => {
            if (u.groups && Array.isArray(u.groups)) {
                u.groups.filter(Boolean).forEach((g) => groupNames.add(g.trim()));
            }
        });

        const groupIdMap: Record<string, string> = {};
        const fetchGroupsIds = async () => {
            try {
                const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/groups`, {
                    headers: { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "" },
                });
                if (!res.ok) return;
                const data = await res.json();
                (data.groups || []).forEach((g: any) => {
                    if (g.name && g.id) groupIdMap[g.name] = g.id;
                });
            } catch { /* ignore */ }
        };

        await fetchGroupsIds();

        for (const name of groupNames) {
            if (groupIdMap[name]) continue;
            try {
                const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/groups`, {
                    method: "POST",
                    headers: {
                        Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name }),
                });
                if (res.ok) await fetchGroupsIds();
            } catch { /* ignore */ }
        }

        const createdUsers: { email: string; groups: string[] }[] = [];

        for (let i = 0; i < updated.length; i++) {
            const u = updated[i];
            if (u.status !== "pending") continue;
            if (!u.username || !u.name || !u.email || !u.role) {
                updated[i] = { ...u, status: "missing fields" };
                continue;
            }
            try {
                const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/users`, {
                    method: "POST",
                    headers: {
                        Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: u.username,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                    }),
                });
                if (!res.ok) {
                    updated[i] = { ...u, status: `error ${res.status}` };
                    continue;
                }
                const data = await res.json();
                updated[i] = { ...u, status: `created (pwd: ${data?.temporary_password ?? "N/A"})` };
                if (u.groups?.length) createdUsers.push({ email: u.email, groups: u.groups });
            } catch {
                updated[i] = { ...u, status: "error" };
            }
        }

        // Assign groups
        try {
            const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/users`, {
                headers: { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "" },
            });
            if (res.ok) {
                const data = await res.json();
                const userMap: Record<string, string> = {};
                (data.users || []).forEach((usr: any) => {
                    if (usr.email && usr.id) userMap[usr.email.toLowerCase()] = usr.id;
                });
                for (const entry of createdUsers) {
                    const uid = userMap[entry.email.toLowerCase()];
                    if (!uid) continue;
                    for (const gName of entry.groups) {
                        const gid = groupIdMap[gName];
                        if (!gid) continue;
                        try {
                            await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(gid)}/members/${encodeURIComponent(uid)}`, {
                                method: "POST",
                                headers: { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "" },
                            });
                        } catch { /* ignore */ }
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
                                        <span className={`text-xs ${u.status.includes("created") ? "text-green-600" : u.status.includes("error") ? "text-rose-600" : "text-muted-foreground/70"}`}>
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
