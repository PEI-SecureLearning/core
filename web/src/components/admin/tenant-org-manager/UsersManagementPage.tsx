import { useEffect, useMemo, useRef, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { UserRecord, Group, BulkUser } from "./types";
import { UserTable } from "./UserTable";
import { UserGrid } from "./UserGrid";
import { UserManagementHeader } from "./UserManagementHeader";
import { NewUserModal } from "./NewUserModal";
import { BulkImportModal } from "./BulkImportModal";
import { mapRole } from "./utils";
import { userApi } from "../../../services/userApi";
import { userGroupsApi } from "../../../services/userGroupsApi";
import { HttpError } from "@/lib/api-client";

type UsersManagementPageProps = {
    readonly initialOpenNewUserModal?: boolean;
};

export function UsersManagementPage({
    initialOpenNewUserModal = false,
}: UsersManagementPageProps) {
    const { keycloak } = useKeycloak();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<"table" | "grid">("table");

    const [showNewUserModal, setShowNewUserModal] = useState(initialOpenNewUserModal);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkUsers, setBulkUsers] = useState<BulkUser[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const tokenRealm = useMemo(() => {
        const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
        if (!iss) return null;
        const parts = iss.split("/realms/");
        return parts[1] ?? null;
    }, [keycloak.tokenParsed]);

    const realm = tokenRealm || "";

    const fetchUsers = async (targetRealm: string) => {
        setIsLoading(true);
        try {
            const data = await userApi.getUsers(targetRealm);
            setUsers(data.users || []);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGroups = async (targetRealm: string) => {
        try {
            const data = await userGroupsApi.getGroups(targetRealm);
            setGroups(data.groups || []);
        } catch (err) {
            console.error("Failed to fetch groups", err);
        }
    };

    useEffect(() => {
        if (realm) {
            fetchUsers(realm);
            fetchGroups(realm);
        }
    }, [realm]);

    const handleDeleteUser = async (id: string) => {
        if (!id || !realm) return;
        const confirmed = globalThis.confirm("Are you sure you want to delete this user?");
        if (!confirmed) return;

        setDeletingIds((prev) => ({ ...prev, [id]: true }));
        try {
            await userApi.deleteUser(realm, id);
            setUsers((prev) => prev.filter((u) => (u.id || u.username) !== id));
        } catch (err) {
            console.error("Failed to delete user", err);
            const message =
                err instanceof HttpError && typeof err.data?.detail === "string"
                    ? err.data.detail
                    : err instanceof Error
                        ? err.message
                        : "Failed to delete user.";
            toast.error(message);
        } finally {
            setDeletingIds((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        }
    };

    const handleCsvUpload = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/org-manager/upload`, {
                method: "POST",
                headers: {
                    Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                },
                body: formData,
            });
            if (!res.ok) throw new Error("Failed to upload CSV");
            const data = await res.json();
            const rows = (data as any[]).map((row) => ({
                username: row.username || "",
                name: row.name || "",
                email: row.email || "",
                role: mapRole(row.role),
                groups:
                    typeof row.groups === "string"
                        ? row.groups
                            .split(",")
                            .map((g: string) => g.trim())
                            .filter(Boolean)
                        : [],
                status: "pending",
            }));
            setBulkUsers(rows);
            setShowBulkModal(true);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredUsers = users.filter((user) => {
        const query = searchQuery.toLowerCase();
        return (
            user.username?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.firstName?.toLowerCase().includes(query) ||
            user.lastName?.toLowerCase().includes(query)
        );
    });

    let usersContent;

    if (isLoading) {
        usersContent = (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary/90" />
                <span className="ml-2 text-muted-foreground">Loading users...</span>
            </div>
        );
    } else if (!realm) {
        usersContent = (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/70" />
                <span className="ml-2 text-muted-foreground">Resolving realm...</span>
            </div>
        );
    } else if (filteredUsers.length === 0) {
        usersContent = (
            <div className="flex flex-col items-center justify-center py-16">
                <Users size={48} className="text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-[15px]">
                    {searchQuery ? "No users match search" : "No users found"}
                </p>
            </div>
        );
    } else if (view === "table") {
        usersContent = (
            <UserTable
                users={filteredUsers}
                deletingIds={deletingIds}
                onDeleteUser={handleDeleteUser}
            />
        );
    } else {
        usersContent = (
            <UserGrid
                users={filteredUsers}
                deletingIds={deletingIds}
                onDeleteUser={handleDeleteUser}
            />
        );
    }

    return (
        <div className="h-full w-full flex flex-col animate-fade-in">
            <UserManagementHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                view={view}
                setView={setView}
                fileInputRef={fileInputRef}
                onNewUser={() => setShowNewUserModal(true)}
            />

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCsvUpload(file);
                    e.target.value = "";
                }}
            />

            <div className="flex-1 overflow-y-auto px-4 mt-4 pb-6 themed-scrollbar">
                {usersContent}
            </div>

            {showNewUserModal && (
                <NewUserModal
                    realm={realm}
                    groups={groups}
                    onClose={() => setShowNewUserModal(false)}
                    onUserCreated={() => realm && fetchUsers(realm)}
                />
            )}

            {showBulkModal && bulkUsers.length > 0 && (
                <BulkImportModal
                    realm={realm}
                    initialBulkUsers={bulkUsers}
                    onClose={() => {
                        setShowBulkModal(false);
                        setBulkUsers([]);
                    }}
                    onBulkCreated={() => realm && fetchUsers(realm)}
                />
            )}
        </div>
    );
}
