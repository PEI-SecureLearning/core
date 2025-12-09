import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/campaigns/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <div>Campaign Details: {id}</div>
}
