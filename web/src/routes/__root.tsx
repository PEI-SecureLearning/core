import { Navbar } from '@/components/navbar'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Sidebar } from '@/components/sidebar'

const RootLayout = () => (
  <>
    <Navbar />
    <Sidebar/>
    <Outlet />
    <TanStackRouterDevtools />
  </>
)

export const Route = createRootRoute({ component: RootLayout })