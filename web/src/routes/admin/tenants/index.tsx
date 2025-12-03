import { createFileRoute } from '@tanstack/react-router'
import { TenantList } from '../../../components/admin/TenantList'

export const Route = createFileRoute('/admin/tenants/')({
    component: TenantList,
})
