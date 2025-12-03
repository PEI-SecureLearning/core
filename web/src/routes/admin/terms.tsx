import { createFileRoute } from '@tanstack/react-router'
import { TermsManager } from '../../components/admin/TermsManager'

export const Route = createFileRoute('/admin/terms')({
  component: RouteComponent,
})

function RouteComponent() {
  return <TermsManager />
}
