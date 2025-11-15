import { createFileRoute } from '@tanstack/react-router'
import UserGroupDetail from '@/Pages/user-details'


export const Route = createFileRoute('/usergroups/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <UserGroupDetail />
}
