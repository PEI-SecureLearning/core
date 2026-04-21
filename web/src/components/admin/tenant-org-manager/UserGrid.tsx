import { Mail, Shield, Trash2, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { UserRecord } from "./types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { isOrgManagerRole } from "./utils";

interface UserGridProps {
    readonly users: UserRecord[];
    readonly deletingIds: Record<string, boolean>;
    onDeleteUser: (id: string) => Promise<void>;
}

export function UserGrid({ users, deletingIds, onDeleteUser }: Readonly<UserGridProps>) {
    const getRoleBadge = (user: UserRecord) => {
        const isOrgManager = isOrgManagerRole(user);
        if (isOrgManager) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/20 text-primary">
                    <Shield size={12} />
                    Org Manager
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                User
            </span>
        );
    };

    if (users.length === 0) {
        return (
            <div className="py-12 text-center">
                <UserAvatar name="U" size="lg" />
                <p className="text-[14px] font-medium text-muted-foreground mt-3">No users found</p>
                <p className="text-[13px] text-muted-foreground/70 mt-1">Add your first user to get started</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((user) => {
                const id = user.id || user.username || "";
                const isOrgManager = isOrgManagerRole(user);
                const isDeleting = deletingIds[id] || false;
                const fullName =
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    user.username;

                return (
                    <div
                        key={id}
                        className="bg-surface border border-border rounded-lg p-5 hover:shadow-md transition-shadow duration-200"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <UserAvatar name={user.firstName || user.username || "U"} size="lg" />
                            {!isOrgManager && (
                                <button
                                    onClick={() => onDeleteUser(id)}
                                    disabled={isDeleting}
                                    className="p-2 text-muted-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            )}
                        </div>
                        <h3 className="font-semibold text-[15px] text-foreground truncate">
                            {fullName}
                        </h3>
                        <p className="text-[13px] text-muted-foreground truncate">@{user.username}</p>
                        <p className="text-[12px] text-muted-foreground/70 truncate mt-1 flex items-center gap-1">
                            <Mail size={12} />
                            {user.email || "—"}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                            {getRoleBadge(user)}
                            <Link
                                to="/users/$id"
                                params={{ id }}
                                className="text-xs font-medium text-primary hover:text-primary/80"
                            >
                                Details
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
