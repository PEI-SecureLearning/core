import { Navbar } from "@/components/navbar";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/sidebar";
import ComplianceFlow from "@/components/compliance";
import { NotFound } from "@/components/NotFound";

const RootLayout = () => {
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
