import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/campaigns/new-campaign')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/campaigns/new-campaign"!</div>
}
