const rawBaseUrl = import.meta.env.BASE_URL || "/";

export const appBasePath =
  rawBaseUrl !== "/" && rawBaseUrl.endsWith("/")
    ? rawBaseUrl.slice(0, -1)
    : rawBaseUrl;

export function stripAppBasePath(pathname: string) {
  if (!pathname) return "/";
  if (appBasePath === "/") return pathname;

  if (pathname === appBasePath) return "/";
  if (pathname.startsWith(`${appBasePath}/`)) {
    return pathname.slice(appBasePath.length) || "/";
  }

  return pathname;
}

export function isAppRoute(pathname: string, routePrefix: string) {
  const normalizedPath = stripAppBasePath(pathname);
  return (
    normalizedPath === routePrefix ||
    normalizedPath.startsWith(`${routePrefix}/`)
  );
}

export function appAssetUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${appBasePath}/${normalizedPath}`.replace(/\/{2,}/g, "/");
}
