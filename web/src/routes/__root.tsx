import { Navbar } from "@/components/navbar";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/sidebar";
import ComplianceFlow from "@/components/compliance";


const RootLayout = () => (
  <div className="h-screen bg-white shadow-md">
    <Navbar />
    <div className="h-[92%] flex flex-row">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <ComplianceFlow />
    </div>
    {/* <TanStackRouterDevtools /> */}
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
