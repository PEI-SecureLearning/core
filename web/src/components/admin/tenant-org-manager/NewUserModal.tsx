import { useState, useRef, useEffect } from "react";
import { X, User, Mail, AtSign, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useKeycloak } from "@react-keycloak/web";
import type { Group, CreateUserField } from "./types";

interface NewUserModalProps {
    realm: string;
    groups: Group[];
    onClose: () => void;
    onUserCreated: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL;

export function NewUserModal({ realm, groups, onClose, onUserCreated }: NewUserModalProps) {
    const { keycloak } = useKeycloak();
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserUsername, setNewUserUsername] = useState("");
    const [newUserRole, setNewUserRole] = useState<"ORG_MANAGER" | "DEFAULT_USER" | "">("");
    const [newUserGroupId, setNewUserGroupId] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createStatus, setCreateStatus] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);
    const [createFieldError, setCreateFieldError] = useState<CreateUserField>(null);

    const nameInputRef = useRef<HTMLInputElement>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const usernameInputRef = useRef<HTMLInputElement>(null);
    const roleFirstOptionRef = useRef<HTMLButtonElement>(null);
    const groupSelectRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (createStatus?.type !== "error" || !createFieldError) return;
        let target: HTMLElement | null;
        switch (createFieldError) {
            case "name": target = nameInputRef.current; break;
            case "email": target = emailInputRef.current; break;
            case "username": target = usernameInputRef.current; break;
            case "role": target = roleFirstOptionRef.current; break;
            case "group": target = groupSelectRef.current; break;
            default: target = null;
        }
        target?.focus();
    }, [createStatus, createFieldError]);

    const handleCreateUser = async () => {
        if (!realm) {
            setCreateStatus({ type: "error", message: "Realm not resolved." });
            return;
        }
        if (!newUserName) {
            setCreateStatus({ type: "error", message: "Name is required." });
            setCreateFieldError("name");
            return;
        }
        if (!newUserEmail) {
            setCreateStatus({ type: "error", message: "Email is required." });
            setCreateFieldError("email");
            return;
        }
        if (!newUserRole) {
            setCreateStatus({ type: "error", message: "Role is required." });
            setCreateFieldError("role");
            return;
        }

        setIsCreating(true);
        setCreateStatus(null);
        setCreateFieldError(null);

        try {
            const res = await fetch(
                `${API_BASE}/org-manager/${encodeURIComponent(realm)}/users`,
                {
                    method: "POST",
                    headers: {
                        Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: newUserUsername || newUserEmail.split("@")[0],
                        name: newUserName,
                        email: newUserEmail,
                        role: newUserRole,
                        group_id: newUserGroupId || undefined,
                    }),
                }
            );

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || `Failed to create user`);
            }

            const data = await res.json();
            toast.success(
                `User created! Temporary password: ${data?.temporary_password ?? "N/A"}`,
                { position: "top-right" }
            );

            onUserCreated();
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create user";
            const lowerError = errorMessage.toLowerCase();
            let errorField: CreateUserField = null;
            if (lowerError.includes("email")) errorField = "email";
            else if (lowerError.includes("username")) errorField = "username";
            else if (lowerError.includes("role")) errorField = "role";
            else if (lowerError.includes("group")) errorField = "group";
            else if (lowerError.includes("name")) errorField = "name";

            setCreateFieldError(errorField);
            setCreateStatus({ type: "error", message: errorMessage });
        } finally {
            setIsCreating(false);
        }
    };

    const roleOptions: Array<{
        value: "ORG_MANAGER" | "DEFAULT_USER";
        label: string;
    }> = [
            { value: "ORG_MANAGER", label: "Organization Manager" },
            { value: "DEFAULT_USER", label: "User" },
        ];

    const getRoleOptionClass = (value: "ORG_MANAGER" | "DEFAULT_USER"): string => {
        if (newUserRole === value) return "bg-primary/10 border-2 border-primary";
        if (createFieldError === "role") return "bg-rose-500/10 border border-rose-400 hover:bg-rose-500/20";
        return "bg-surface-subtle border border-border hover:bg-muted";
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-surface-subtle">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Create New User</h2>
                        <p className="text-sm text-muted-foreground">Add a new user to your organization</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted rounded-lg transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">
                            Full Name <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={newUserName}
                                onChange={(e) => {
                                    setNewUserName(e.target.value);
                                    if (createFieldError === "name") {
                                        setCreateFieldError(null);
                                        setCreateStatus(null);
                                    }
                                }}
                                placeholder="John Doe"
                                className={`w-full pl-11 pr-4 py-2.5 rounded-md bg-surface-subtle text-[14px] placeholder:text-muted-foreground/70 focus:outline-none transition-all ${createFieldError === "name"
                                    ? "border border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                                    : "border border-border focus:ring-2 focus:ring-primary/30 focus:border-purple-400"
                                    }`}
                            />
                        </div>
                        {createStatus?.type === "error" && createFieldError === "name" && (
                            <p className="mt-1.5 text-[12px] text-rose-600">{createStatus.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">
                            Email <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                            <input
                                ref={emailInputRef}
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => {
                                    setNewUserEmail(e.target.value);
                                    if (createFieldError === "email") {
                                        setCreateFieldError(null);
                                        setCreateStatus(null);
                                    }
                                }}
                                placeholder="john.doe@example.com"
                                className={`w-full pl-11 pr-4 py-2.5 rounded-md bg-surface-subtle text-[14px] placeholder:text-muted-foreground/70 focus:outline-none transition-all ${createFieldError === "email"
                                    ? "border border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                                    : "border border-border focus:ring-2 focus:ring-primary/30 focus:border-purple-400"
                                    }`}
                            />
                        </div>
                        {createStatus?.type === "error" && createFieldError === "email" && (
                            <p className="mt-1.5 text-[12px] text-rose-600">{createStatus.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Username</label>
                        <div className="relative">
                            <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                            <input
                                ref={usernameInputRef}
                                type="text"
                                value={newUserUsername}
                                onChange={(e) => {
                                    setNewUserUsername(e.target.value);
                                    if (createFieldError === "username") {
                                        setCreateFieldError(null);
                                        setCreateStatus(null);
                                    }
                                }}
                                placeholder="Username"
                                maxLength={40}
                                className={`w-full pl-11 pr-4 py-2.5 rounded-md bg-surface-subtle text-[14px] placeholder:text-muted-foreground/70 focus:outline-none transition-all ${createFieldError === "username"
                                    ? "border border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                                    : "border border-border focus:ring-2 focus:ring-primary/30 focus:border-purple-400"
                                    }`}
                            />
                        </div>
                        {createStatus?.type === "error" && createFieldError === "username" && (
                            <p className="mt-1.5 text-[12px] text-rose-600">{createStatus.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">
                            Role <span className="text-rose-400">*</span>
                        </label>
                        <div className="space-y-2">
                            {roleOptions.map((option) => (
                                <button
                                    key={option.value}
                                    ref={option.value === "ORG_MANAGER" ? roleFirstOptionRef : undefined}
                                    type="button"
                                    onClick={() => setNewUserRole(option.value)}
                                    onFocus={() => {
                                        if (createFieldError === "role") {
                                            setCreateFieldError(null);
                                            setCreateStatus(null);
                                        }
                                    }}
                                    className={`w-full p-3 rounded-md text-left transition-all duration-200 flex items-center justify-between ${getRoleOptionClass(option.value)} cursor-pointer`}
                                >
                                    <span className={`font-medium text-[14px] ${newUserRole === option.value ? "text-primary" : "text-foreground/90"}`}>
                                        {option.label}
                                    </span>
                                    {newUserRole === option.value && <Check size={18} className="text-primary" />}
                                </button>
                            ))}
                        </div>
                        {createStatus?.type === "error" && createFieldError === "role" && (
                            <p className="mt-1.5 text-[12px] text-rose-600">{createStatus.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Group (Optional)</label>
                        <select
                            ref={groupSelectRef}
                            value={newUserGroupId}
                            onChange={(e) => {
                                setNewUserGroupId(e.target.value);
                                if (createFieldError === "group") {
                                    setCreateFieldError(null);
                                    setCreateStatus(null);
                                }
                            }}
                            className={`w-full px-4 py-2.5 rounded-md bg-surface-subtle text-[14px] focus:outline-none transition-all ${createFieldError === "group"
                                ? "border border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                                : "border border-border focus:ring-2 focus:ring-primary/30 focus:border-purple-400"
                                }`}
                        >
                            <option value="">No group</option>
                            {groups.map((g) => (
                                <option key={g.id} value={g.id || ""}>{g.name}</option>
                            ))}
                        </select>
                        {createStatus?.type === "error" && createFieldError === "group" && (
                            <p className="mt-1.5 text-[12px] text-rose-600">{createStatus.message}</p>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-border/40 bg-background">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-[14px] font-medium text-muted-foreground bg-muted hover:bg-muted/60 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateUser}
                            disabled={!newUserName || !newUserEmail || !newUserRole || isCreating}
                            className="px-6 py-2.5 rounded-xl text-[14px] font-medium text-white bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25"
                        >
                            {isCreating ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    Creating...
                                </span>
                            ) : "Create User"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
