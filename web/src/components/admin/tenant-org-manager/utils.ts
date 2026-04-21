export function mapRole(
    value: string | undefined
): "ORG_MANAGER" | "DEFAULT_USER" | "" {
    const v = (value || "").trim().toLowerCase();
    if (
        ["org_manager", "org manager", "organization manager", "org"].includes(v)
    )
        return "ORG_MANAGER";
    if (["default_user", "default user", "user", "default"].includes(v))
        return "DEFAULT_USER";
    return "";
}

export function isOrgManagerRole(user: {
    role?: string;
    isOrgManager?: boolean;
    is_org_manager?: boolean;
}): boolean {
    const normalizedRole = (user.role || "").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
    if (normalizedRole === "org_manager") return true;
    if (normalizedRole === "default_user" || normalizedRole === "user") return false;

    return user.isOrgManager ?? user.is_org_manager ?? false;
}
