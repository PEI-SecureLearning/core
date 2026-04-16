import { Navbar } from "@/components/navbar";
import { AppLoader } from "@/components/AppLoader";
import { getDefaultAuthorizedPath, canAccessPath } from "@/lib/route-access";
import { createRootRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { Sidebar } from "@/components/sidebar";
import ComplianceFlow from "@/components/compliance";
import { NotFound } from "@/components/NotFound";
import { useKeycloak } from "@react-keycloak/web";

const RootLayout = () => {
  const { keycloak, initialized } = useKeycloak();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (!initialized) {
    return <AppLoader visible label="Loading SecureLearning..." />;
  }

  const userRoles = keycloak.tokenParsed?.realm_access?.roles ?? [];
  const realmFeatures =
    (keycloak.tokenParsed as { features?: Record<string, boolean> } | undefined)
      ?.features ?? {};
  const fallbackPath = getDefaultAuthorizedPath(userRoles);
  const allowed = canAccessPath({
    pathname,
    userRoles,
    realmFeatures,
    realmName: keycloak.realm,
  });

  if (!allowed && pathname !== fallbackPath) {
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <div className="h-screen bg-background text-foreground">
      <Navbar />
      <div className="h-[92%] flex flex-row">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
        <ComplianceFlow />
      </div>
    </div>
  );
};

export const Route = createRootRoute({ component: RootLayout, notFoundComponent: NotFound });
