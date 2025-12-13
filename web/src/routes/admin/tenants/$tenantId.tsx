import { createFileRoute } from '@tanstack/react-router'
import { TenantDetails } from '../../../components/admin/TenantDetails'

export const Route = createFileRoute('/admin/tenants/$tenantId')({
  component: TenantDetails,
})
