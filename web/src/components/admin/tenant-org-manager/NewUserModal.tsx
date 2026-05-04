import { useState, useRef, useEffect } from "react";
import { X, User, Mail, AtSign, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import RequiredAsterisk from "@/components/shared/RequiredAsterisk";
import type { Group, CreateUserField } from "./types";
import { userApi } from "@/services/userApi";
import {
    createRealmEmailDomainValidator,
    deriveUsername,
    getUserCreationValidation,
    mapUserCreationErrorToField,
    validateSelectedGroup,
} from "./userCreationValidation";

type EmailDomainValidationState =
    | { status: "idle" }
    | { status: "checking" }
    | { status: "valid"; domain: string }
    | { status: "invalid"; message: string };

interface NewUserModalProps {
    realm: string;
    groups: Group[];
    onClose: () => void;
    onUserCreated: () => void;
}

export function NewUserModal({ realm, groups, onClose, onUserCreated }: Readonly<NewUserModalProps>) {
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
    const [emailDomainValidation, setEmailDomainValidation] = useState<EmailDomainValidationState>({ status: "idle" });

    const nameInputRef = useRef<HTMLInputElement>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const usernameInputRef = useRef<HTMLInputElement>(null);
    const roleFirstOptionRef = useRef<HTMLButtonElement>(null);
    const groupSelectRef = useRef<HTMLSelectElement>(null);
    const validateEmailDomainAgainstRealmRef = useRef(createRealmEmailDomainValidator(realm));

    const { normalized, nameError, emailError, usernameError } = getUserCreationValidation({
        username: newUserUsername,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
    });
    const normalizedName = normalized.name;
    const normalizedEmail = normalized.email;
    const derivedUsername = deriveUsername(normalizedEmail, normalized.username);
    const groupValidationMessage = validateSelectedGroup(
        newUserGroupId,
        groups.map((group) => group.id || "").filter(Boolean)
    );

    const emailErrorMessage =
        createFieldError === "email" && createStatus?.type === "error"
            ? createStatus.message
            : emailError || (emailDomainValidation.status === "invalid" ? emailDomainValidation.message : null);

    const usernameErrorMessage =
        createFieldError === "username" && createStatus?.type === "error"
            ? createStatus.message
            : usernameError;

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

    useEffect(() => {
        setEmailDomainValidation({ status: "idle" });
        validateEmailDomainAgainstRealmRef.current = createRealmEmailDomainValidator(realm);
    }, [realm]);

    const runEmailDomainValidation = async (): Promise<string | null> => {
        if (emailError) {
            setEmailDomainValidation({ status: "idle" });
            return emailError;
        }

        setEmailDomainValidation({ status: "checking" });
        const validationMessage = await validateEmailDomainAgainstRealmRef.current(normalizedEmail);

        if (validationMessage) {
            setEmailDomainValidation({ status: "invalid", message: validationMessage });
            return validationMessage;
        }

        setEmailDomainValidation({ status: "valid", domain: normalizedEmail.split("@")[1] });
        return null;
    };

    const handleCreateUser = async () => {
        if (!realm) {
            setCreateStatus({ type: "error", message: "Realm not resolved." });
            return;
        }
        if (nameError) {
            setCreateStatus({ type: "error", message: nameError });
            setCreateFieldError("name");
            return;
        }
        if (emailError) {
            setCreateStatus({ type: "error", message: emailError });
            setCreateFieldError("email");
            return;
        }
        if (usernameError) {
            setCreateStatus({ type: "error", message: usernameError });
            setCreateFieldError("username");
            return;
        }
        if (!newUserRole) {
            setCreateStatus({ type: "error", message: "Role is required." });
            setCreateFieldError("role");
            return;
        }
        if (groupValidationMessage) {
            setCreateStatus({ type: "error", message: groupValidationMessage });
            setCreateFieldError("group");
            return;
        }

        const emailDomainError = await runEmailDomainValidation();
        if (emailDomainError) {
            setCreateStatus({ type: "error", message: emailDomainError });
            setCreateFieldError("email");
            return;
        }

        setIsCreating(true);
        setCreateStatus(null);
        setCreateFieldError(null);

        try {
            await userApi.createUser(
                realm,
                {
                    username: derivedUsername,
                    name: normalizedName,
                    email: normalizedEmail,
                    role: newUserRole,
                    group_id: newUserGroupId || undefined,
                }
            );
            toast.success(
                `User created! Invitation email sent.`,
                { position: "top-right" }
            );

            onUserCreated();
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create user";
            setCreateFieldError(mapUserCreationErrorToField(errorMessage));
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
        if (createFieldError === "role") return "bg-error/10 border border-error/50 hover:bg-error/20";
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
                            Full Name <RequiredAsterisk isValid={!!newUserName.trim()} />
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
                                maxLength={120}
                                aria-invalid={!!(createFieldError === "name" || (newUserName && nameError))}
                                className={`w-full pl-11 pr-4 py-2.5 rounded-md bg-surface-subtle text-[14px] placeholder:text-muted-foreground/70 focus:outline-none transition-all ${createFieldError === "name"
                                    ? "border border-error/50 focus:ring-2 focus:ring-error/20 focus:border-error"
                                    : "border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    }`}
                            />
                        </div>
                        {((createStatus?.type === "error" && createFieldError === "name") || (!!newUserName && !!nameError)) && (
                            <p className="mt-1.5 text-[12px] text-error">
                                {createFieldError === "name" && createStatus?.type === "error" ? createStatus.message : nameError}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">
                            Email <RequiredAsterisk isValid={!!newUserEmail.trim()} />
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                            <input
                                ref={emailInputRef}
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => {
                                    setNewUserEmail(e.target.value);
                                    setEmailDomainValidation({ status: "idle" });
                                    if (createFieldError === "email") {
                                        setCreateFieldError(null);
                                        setCreateStatus(null);
                                    }
                                }}
                                onBlur={() => {
                                    if (!emailError) {
                                        void runEmailDomainValidation();
                                    }
                                }}
                                placeholder="john.doe@example.com"
                                aria-invalid={!!emailErrorMessage}
                                className={`w-full pl-11 pr-4 py-2.5 rounded-md bg-surface-subtle text-[14px] placeholder:text-muted-foreground/70 focus:outline-none transition-all ${emailErrorMessage
                                    ? "border border-error/50 focus:ring-2 focus:ring-error/20 focus:border-error"
                                    : "border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    }`}
                            />
                        </div>
                        {emailDomainValidation.status === "checking" && (
                            <p className="mt-1.5 text-[12px] text-muted-foreground">Verifying organization domain...</p>
                        )}
                        {emailErrorMessage && <p className="mt-1.5 text-[12px] text-error">{emailErrorMessage}</p>}
                    </div>

                    <div>
                        <label htmlFor="new-user-username" className="block text-[12px] font-medium text-muted-foreground mb-1.5">
                            Username <RequiredAsterisk isValid={!!newUserUsername.trim()} />
                        </label>
                        <div className="relative">
                            <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                            <input
                                id="new-user-username"
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
                                aria-invalid={!!usernameErrorMessage}
                                className={`w-full pl-11 pr-4 py-2.5 rounded-md bg-surface-subtle text-[14px] placeholder:text-muted-foreground/70 focus:outline-none transition-all ${usernameErrorMessage
                                    ? "border border-error/50 focus:ring-2 focus:ring-error/20 focus:border-error"
                                    : "border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    }`}
                            />
                        </div>
                        {usernameErrorMessage && <p className="mt-1.5 text-[12px] text-error">{usernameErrorMessage}</p>}
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">
                            Role <RequiredAsterisk isValid={!!newUserRole} />
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
                            <p className="mt-1.5 text-[12px] text-error">{createStatus.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="new-user-group" className="block text-[12px] font-medium text-muted-foreground mb-1.5">Group (Optional)</label>
                        <select
                            id="new-user-group"
                            ref={groupSelectRef}
                            value={newUserGroupId}
                            onChange={(e) => {
                                setNewUserGroupId(e.target.value);
                                if (createFieldError === "group") {
                                    setCreateFieldError(null);
                                    setCreateStatus(null);
                                }
                            }}
                            aria-invalid={!!((createFieldError === "group" && createStatus?.type === "error") || groupValidationMessage)}
                            className={`w-full px-4 py-2.5 rounded-md bg-surface-subtle text-[14px] focus:outline-none transition-all ${(createFieldError === "group" && createStatus?.type === "error") || groupValidationMessage
                                ? "border border-error/50 focus:ring-2 focus:ring-error/20 focus:border-error"
                                : "border border-border focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                }`}
                        >
                            <option value="">No group</option>
                            {groups.map((g) => (
                                <option key={g.id} value={g.id || ""}>{g.name}</option>
                            ))}
                        </select>
                        {((createStatus?.type === "error" && createFieldError === "group") || groupValidationMessage) && (
                            <p className="mt-1.5 text-[12px] text-error">
                                {createFieldError === "group" && createStatus?.type === "error" ? createStatus.message : groupValidationMessage}
                            </p>
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
                            disabled={
                                !normalizedName ||
                                !normalizedEmail ||
                                !newUserRole ||
                                !!nameError ||
                                !!emailError ||
                                !!usernameError ||
                                !!groupValidationMessage ||
                                emailDomainValidation.status === "checking" ||
                                isCreating
                            }
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
