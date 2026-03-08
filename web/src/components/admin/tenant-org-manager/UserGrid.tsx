import { Mail, Shield, Trash2, Loader2 } from "lucide-react";
import type { UserRecord } from "./types";

interface UserGridProps {
    users: UserRecord[];
    deletingIds: Record<string, boolean>;
    onDeleteUser: (id: string) => Promise<void>;
}

export function UserGrid({ users, deletingIds, onDeleteUser }: UserGridProps) {
    const getRoleBadge = (user: UserRecord) => {
        const isOrgManager = user.isOrgManager ?? user.is_org_manager ?? false;
        if (isOrgManager) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700">
                    <Shield size={12} />
                    Org Manager
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                User
            </span>
        );
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((user) => {
                const id = user.id || user.username || "";
                const isOrgManager = user.isOrgManager ?? user.is_org_manager ?? false;
                const isDeleting = deletingIds[id] || false;
                const fullName =
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    user.username;

                return (
                    <div
                        key={id}
                        className="liquid-glass-card p-5 hover:shadow-xl transition-all duration-200"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                                {(user.firstName?.[0] || user.username?.[0] || "U").toUpperCase()}
                            </div>
                            {!isOrgManager && (
                                <button
                                    onClick={() => onDeleteUser(id)}
                                    disabled={isDeleting}
                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            )}
                        </div>
                        <h3 className="font-semibold text-[15px] text-gray-900 truncate">
                            {fullName}
                        </h3>
                        <p className="text-[13px] text-gray-500 truncate">@{user.username}</p>
                        <p className="text-[12px] text-gray-400 truncate mt-1 flex items-center gap-1">
                            <Mail size={12} />
                            {user.email || "—"}
                        </p>
                        <div className="mt-3">{getRoleBadge(user)}</div>
                    </div>
                );
            })}
        </div>
    );
}
