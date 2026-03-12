import { Mail, Shield, Trash2, Loader2 } from "lucide-react";
import type { UserRecord } from "./types";

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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-100 text-purple-700">
                    <Shield size={12} />
                    Org Manager
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                User
            </span>
        );
    };

    return (
        <div className="liquid-glass-card overflow-hidden ">
            <table className="w-full border-2 border-gray-100 shadow-md">
                <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200/60">
                        <th className="text-left px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            User
                        </th>
                        <th className="text-left px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Email
                        </th>
                        <th className="text-left px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Role
                        </th>
                        <th className="text-right px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/60">
                    {users.map((user) => {
                        const id = user.id || user.username || "";
                        const isOrgManager = user.isOrgManager ?? user.is_org_manager ?? false;
                        const isDeleting = deletingIds[id] || false;
                        const fullName =
                            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                            user.username;

                        return (
                            <tr key={id} className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                                            {(user.firstName?.[0] || user.username?.[0] || "U").toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-[14px] text-gray-900">{fullName}</p>
                                            <p className="text-[12px] text-gray-500">@{user.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-[14px] text-gray-600">
                                        <Mail size={14} className="text-gray-400" />
                                        {user.email || "—"}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{getRoleBadge(user)}</td>
                                <td className="px-6 py-4 text-right">
                                    {!isOrgManager && (
                                        <button
                                            onClick={() => onDeleteUser(id)}
                                            disabled={isDeleting}
                                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
