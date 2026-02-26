import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useKeycloak } from '@react-keycloak/web'
import { ModuleCreationForm } from '@/components/content-manager/ModuleCreationForm'

export const Route = createFileRoute('/content-manager/modules/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()
    const { keycloak } = useKeycloak()

    return (
        <ModuleCreationForm
            token={keycloak.token}
            onSuccess={() => navigate({ to: '/content-manager/modules' })}
            onBack={() => navigate({ to: '/content-manager/modules' })}
        />
    )
}
