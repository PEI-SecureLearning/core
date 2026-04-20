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
