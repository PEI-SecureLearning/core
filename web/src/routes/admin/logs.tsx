import { createFileRoute } from '@tanstack/react-router'
import { LogViewer } from '../../components/admin/LogViewer'

export const Route = createFileRoute('/admin/logs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LogViewer />
}
