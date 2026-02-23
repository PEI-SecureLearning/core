import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '../components/admin/AdminLayout'
import keycloak from '../keycloak'

export const Route = createFileRoute('/admin')({
    beforeLoad: () => {
        const roles = keycloak.tokenParsed?.realm_access?.roles || []
        const isAdmin = roles.includes('admin')
        const isContentManager = roles.includes('content_manager')

        if (!isAdmin) {
            throw redirect({ to: isContentManager ? '/content' : '/dashboard' })
        }
    },
    component: AdminLayout,
})
