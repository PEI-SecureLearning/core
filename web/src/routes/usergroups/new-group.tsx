import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/usergroups/new-group')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/usergroups/new-group"!</div>
}
