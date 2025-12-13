import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tenants/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/tenants/id"!</div>
}
