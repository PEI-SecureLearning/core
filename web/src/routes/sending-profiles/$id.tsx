import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sending-profiles/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/sending-profiles/$id"!</div>
}
