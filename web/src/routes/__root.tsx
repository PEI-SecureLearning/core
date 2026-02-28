import { Navbar } from "@/components/navbar";
import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Sidebar } from "@/components/sidebar";
import ComplianceFlow from "@/components/Compliance";
import { useKeycloak } from "@react-keycloak/web";
import { useMemo } from "react";
import { isComplianceEligibleUser } from "@/lib/compliance-eligibility";


const RootLayout = () => {
  const { keycloak, initialized } = useKeycloak();
  const routerState = useRouterState();

  const shouldMountCompliance = useMemo(() => {
    return isComplianceEligibleUser({
      initialized,
      authenticated: !!keycloak.authenticated,
      tokenParsed: keycloak.tokenParsed,
      pathname: routerState.location.pathname,
    });
  }, [initialized, keycloak.authenticated, keycloak.tokenParsed, routerState.location.pathname]);

  return (
    <div className="h-screen bg-white shadow-md rounded-xl">
      <Navbar />
      <div className="h-[92%] flex flex-row">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
        {shouldMountCompliance ? <ComplianceFlow /> : null}
      </div>
      {/* <TanStackRouterDevtools /> */}
    </div>
  );
};

export const Route = createRootRoute({ component: RootLayout });
