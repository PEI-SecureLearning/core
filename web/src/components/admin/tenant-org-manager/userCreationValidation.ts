import { HttpError, apiClient } from "@/lib/api-client";
import { getEmailDomain, isValidEmail } from "@/lib/emailValidation";

export type CreateUserRole = "ORG_MANAGER" | "DEFAULT_USER";

export type UserCreationDraft = {
    username?: string;
    name?: string;
    email?: string;
    role?: string;
    groups?: string[];
};

export type NormalizedUserCreationDraft = {
    username: string;
    name: string;
    email: string;
    role: string;
    groups: string[];
};

type RealmLookupResponse = {
    realm?: string;
};

export function normalizeUserCreationDraft(draft: UserCreationDraft): NormalizedUserCreationDraft {
    return {
        username: (draft.username || "").trim(),
        name: (draft.name || "").trim(),
        email: (draft.email || "").trim().toLowerCase(),
        role: (draft.role || "").trim().toUpperCase(),
        groups: Array.isArray(draft.groups)
            ? draft.groups.map((group) => group.trim()).filter(Boolean)
            : [],
    };
}

export function deriveUsername(email: string, username?: string): string {
    const usernameTrimmed = (username || "").trim();
    if (usernameTrimmed) return usernameTrimmed;

    const domain = getEmailDomain(email);
    return domain ? email.split("@")[0] : "";
}

export function validateName(name: string): string | null {
    if (!name) return "Name is required.";
    if (name.length < 2) return "Name must contain at least 2 characters.";
    if (name.length > 120) return "Name must be 120 characters or fewer.";
    return null;
}

export function validateEmail(email: string): string | null {
    if (!email) return "Email is required.";
    if (!isValidEmail(email)) return "Please enter a valid email address.";
    return null;
}

export function validateUsername(email: string, username?: string): string | null {
    const resolvedUsername = deriveUsername(email, username);

    if (!resolvedUsername) {
        return "Username is required or must be derivable from the email address.";
    }
    if (resolvedUsername.length < 3) {
        return "Username must contain at least 3 characters.";
    }
    if (resolvedUsername.length > 40) {
        return username?.trim()
            ? "Username must be 40 characters or fewer."
            : "Username derived from email is too long. Enter a shorter username.";
    }
    if (!/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/i.test(resolvedUsername)) {
        return "Username may only contain letters, numbers, dots, underscores, and hyphens.";
    }
    return null;
}

export function validateRole(role: string): string | null {
    if (!role) return "Role is required.";
    if (!["ORG_MANAGER", "DEFAULT_USER"].includes(role)) {
        return `Role "${role}" is invalid. Use ORG_MANAGER or DEFAULT_USER.`;
    }
    return null;
}

export function validateSelectedGroup(groupId: string, availableGroupIds: string[]): string | null {
    if (!groupId) return null;
    if (!availableGroupIds.includes(groupId)) return "Selected group is no longer available.";
    return null;
}

export function getUserCreationValidation(draft: UserCreationDraft) {
    const normalized = normalizeUserCreationDraft(draft);

    return {
        normalized,
        nameError: validateName(normalized.name),
        emailError: validateEmail(normalized.email),
        usernameError: validateUsername(normalized.email, normalized.username),
        roleError: validateRole(normalized.role),
    };
}

export function mapUserCreationErrorToField(message: string): "name" | "email" | "username" | "role" | "group" | null {
    const lowerError = message.toLowerCase();
    if (lowerError.includes("email")) return "email";
    if (lowerError.includes("username")) return "username";
    if (lowerError.includes("role")) return "role";
    if (lowerError.includes("group")) return "group";
    if (lowerError.includes("name")) return "name";
    return null;
}

export function toUserFriendlyCreationError(error: unknown): string {
    if (error instanceof HttpError) {
        const detail = error.data?.detail;
        if (typeof detail === "string" && detail.trim()) return detail;
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return "Could not create this user.";
}

export function createRealmEmailDomainValidator(realm: string) {
    const cache: Record<string, string | null> = {};

    return async (email: string): Promise<string | null> => {
        const emailError = validateEmail(email);
        if (emailError) return emailError;

        const domain = getEmailDomain(email);
        if (!domain) return "Please enter a valid email address.";

        const cachedRealm = cache[domain];
        if (cachedRealm !== undefined) {
            if (cachedRealm === realm) return null;
            if (cachedRealm === null) {
                return `Email domain "${domain}" is not registered for this organization.`;
            }
            return `Email domain "${domain}" belongs to a different organization.`;
        }

        try {
            const response = await apiClient.get<RealmLookupResponse>(
                `/realms?domain=${encodeURIComponent(domain)}`
            );
            const matchedRealm = response.realm ?? null;
            cache[domain] = matchedRealm;

            if (matchedRealm !== realm) {
                return `Email domain "${domain}" belongs to a different organization.`;
            }

            return null;
        } catch (error) {
            if (error instanceof HttpError && error.status === 404) {
                cache[domain] = null;
                return `Email domain "${domain}" is not registered for this organization.`;
            }

            return `Could not verify email domain "${domain}". Please try again.`;
        }
    };
}
