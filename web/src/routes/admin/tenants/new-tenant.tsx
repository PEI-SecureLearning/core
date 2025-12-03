import { createFileRoute } from '@tanstack/react-router'
import { CreateTenantPage } from '../../../components/AdminPanel'

export const Route = createFileRoute('/admin/tenants/new-tenant')({
  component: RouteComponent,
})

function RouteComponent() {
  return <CreateTenantPage />
}
