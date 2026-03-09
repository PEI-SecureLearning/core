import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tenants/new-tenant')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/tenants/new-tenant"!</div>
}
