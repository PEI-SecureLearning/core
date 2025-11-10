import { Navbar } from "@/components/navbar";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Sidebar } from "@/components/sidebar";

const RootLayout = () => (
  <>
    <div className="flex flex-col h-screen">
      {/* Top Navbar */}
      <Navbar />

      {/* Main content area: Sidebar + Outlet */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (fixed width, full height of remaining screen) */}
        <Sidebar />

        {/* Page content (fills the rest) */}
        <main className="flex-1 overflow-auto bg-white p-6">
          <Outlet />
        </main>
      </div>
    </div>

    {/* <TanStackRouterDevtools /> */}
  </>
);

export const Route = createRootRoute({ component: RootLayout });
