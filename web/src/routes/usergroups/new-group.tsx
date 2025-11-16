import NewUserGroup from '@/components/usergroups/userGroupNewGroup'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/usergroups/new-group')({
  component: RouteComponent,
})

function RouteComponent() {
  return <NewUserGroup />
}
