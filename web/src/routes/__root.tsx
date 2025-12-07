import { Navbar } from "@/components/navbar";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/sidebar";
import { useKeycloak } from "@react-keycloak/web";
import ComplianceFlow from "@/components/Compliance";


const RootLayout = () => (
  <>

    <div className="h-screen bg-white shadow-md rounded-xl">
      <Navbar />
      <div className="h-[92%] flex flex-row">
        <Sidebar />
        <Outlet />
        <ComplianceFlow />
      </div>
      {/* <TanStackRouterDevtools /> */}
    </div>
  </>
);

export const Route = createRootRoute({ component: RootLayout });
