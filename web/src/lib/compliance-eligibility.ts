import type { KeycloakTokenParsed } from "keycloak-js";

export interface ComplianceEligibilityParams {
    initialized: boolean;
    authenticated: boolean;
    tokenParsed: KeycloakTokenParsed | undefined;
    pathname: string;
}

/**
 * Paths that should bypass the compliance flow entirely.
 * Add any public/auth routes here.
 */
const EXCLUDED_PATHS = ["/login", "/logout", "/admin", "/content-manager"];

/**
 * Returns true if the compliance flow should be shown to the current user.
 *
 * Conditions to be eligible:
 *  - Keycloak is fully initialized
 *  - The user is authenticated
 *  - The current route is not in the excluded paths list
 */
export function isComplianceEligibleUser({
    initialized,
    authenticated,
    pathname,
}: ComplianceEligibilityParams): boolean {
    if (!initialized || !authenticated) {
        return false;
    }

    const isExcluded = EXCLUDED_PATHS.some((excluded) =>
        pathname.startsWith(excluded)
    );

    return !isExcluded;
}
