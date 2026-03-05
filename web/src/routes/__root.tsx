import { Navbar } from "@/components/navbar";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/sidebar";
import ComplianceFlow from "@/components/compliance";
import { NavigationLoadingProvider } from "@/lib/navigation-loading";

const RootLayout = () => {
  return (
    <NavigationLoadingProvider>
      <div className="h-screen bg-white shadow-md rounded-xl">
        <Navbar />
        <div className="h-[92%] flex flex-row">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
          <ComplianceFlow />
        </div>
      </div>
    </NavigationLoadingProvider>
  );
};

export const Route = createRootRoute({ component: RootLayout });
