import { Mail, Shield, Trash2, Loader2 } from "lucide-react";
import type { UserRecord } from "./types";
import { UserAvatar } from "@/components/shared/UserAvatar";

interface UserTableProps {
    users: UserRecord[];
    deletingIds: Record<string, boolean>;
    onDeleteUser: (id: string) => Promise<void>;
}

export function UserTable({ users, deletingIds, onDeleteUser }: UserTableProps) {
    const getRoleBadge = (user: UserRecord) => {
        const isOrgManager = user.isOrgManager ?? user.is_org_manager ?? false;
        if (isOrgManager) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/20 text-primary">
                    <Shield size={12} />
                    Org Manager
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
                User
            </span>
        );
    };

    return (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-surface-subtle/80 border-b border-border/60">
                        <th className="text-left px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            User
                        </th>
                        <th className="text-left px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Email
                        </th>
                        <th className="text-left px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Role
                        </th>
                        <th className="text-right px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                    {users.map((user) => {
                        const id = user.id || user.username || "";
                        const isOrgManager = user.isOrgManager ?? user.is_org_manager ?? false;
                        const isDeleting = deletingIds[id] || false;
                        const fullName =
                            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                            user.username;

                        return (
                            <tr key={id} className="hover:bg-surface-subtle/60 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar name={user.firstName || user.username || "U"} size="sm" shape="rounded" />
                                        <div>
                                            <p className="font-medium text-[14px] text-foreground">{fullName}</p>
                                            <p className="text-[12px] text-muted-foreground">@{user.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
                                        <Mail size={14} className="text-muted-foreground/70" />
                                        {user.email || "—"}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{getRoleBadge(user)}</td>
                                <td className="px-6 py-4 text-right">
                                    {!isOrgManager && (
                                        <button
                                            onClick={() => onDeleteUser(id)}
                                            disabled={isDeleting}
                                            className="p-2 text-muted-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isDeleting ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
