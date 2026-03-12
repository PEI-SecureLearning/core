import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/compliance-org-manager')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/compliance-org-manager"!</div>
}
