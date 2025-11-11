import { Navbar } from "@/components/navbar";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Sidebar } from "@/components/sidebar";

const RootLayout = () => (
  <>
  <div className="h-screen bg-purple-900 p-1">
    <div className="h-full bg-white shadow-md rounded-xl">
      <Navbar />
      <div className='h-[92%] flex flex-row'>
        <Sidebar/>
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </div>
  </div>
  </>
)


export const Route = createRootRoute({ component: RootLayout });
