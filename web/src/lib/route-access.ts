import {
  adminLinks,
  contentManagerLinks,
  userLinks,
  type NavLinkDef,
} from "@/config/navLinks";

type RoutePolicy = {
  prefix: string;
  roles?: string[];
  feature?: string;
};

type RouteAccessInput = {
  pathname: string;
  userRoles: string[];
  realmFeatures: Record<string, boolean>;
  realmName?: string;
};

const ROUTE_POLICIES: RoutePolicy[] = buildRoutePolicies([
  ...adminLinks,
  ...contentManagerLinks,
  ...userLinks,
]);

function buildRoutePolicies(links: NavLinkDef[]) {
  const policyByPrefix = new Map<string, RoutePolicy>();

  for (const link of links) {
    if (!link.roles && !link.feature) {
      continue;
    }

    policyByPrefix.set(link.href, {
      prefix: link.href,
      roles: link.roles,
      feature: link.feature,
    });
  }

  return [...policyByPrefix.values()].sort(
    (left, right) => right.prefix.length - left.prefix.length,
  );
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function normalizeRoles(userRoles: string[]) {
  return new Set(userRoles.map((role) => role.toLowerCase()));
}

function normalizeRequiredRole(requiredRole: string, realmName?: string) {
  const resolvedRole =
    requiredRole === "default-roles-$realmname" && realmName
      ? `default-roles-${realmName}`
      : requiredRole;
  return resolvedRole.toLowerCase();
}

function hasRequiredRole(
  userRoles: string[],
  requiredRoles: string[],
  realmName?: string,
) {
  const normalizedRoles = normalizeRoles(userRoles);
  return requiredRoles.some((requiredRole) =>
    normalizedRoles.has(normalizeRequiredRole(requiredRole, realmName)),
  );
}

export function canAccessPath({
  pathname,
  userRoles,
  realmFeatures,
  realmName,
}: RouteAccessInput) {
  const matchingPolicy = ROUTE_POLICIES.find((policy) =>
    matchesPrefix(pathname, policy.prefix),
  );

  if (!matchingPolicy) {
    return true;
  }

  if (matchingPolicy.feature && !realmFeatures[matchingPolicy.feature]) {
    return false;
  }

  if (matchingPolicy.roles) {
    return hasRequiredRole(userRoles, matchingPolicy.roles, realmName);
  }

  return true;
}

export function getDefaultAuthorizedPath(userRoles: string[]) {
  const normalizedRoles = normalizeRoles(userRoles);

  if (normalizedRoles.has("admin")) {
    return "/admin";
  }

  if (normalizedRoles.has("content_manager")) {
    return "/content-manager";
  }

  return "/dashboard";
}
