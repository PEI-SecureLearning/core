import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/campaigns/id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/campaigns/id"!</div>
}
