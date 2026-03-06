import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useKeycloak } from '@react-keycloak/web'
import { ModuleCreationForm } from '@/components/content-manager/modules/ModuleCreationForm'

export const Route = createFileRoute('/content-manager/modules_/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()
    const { keycloak } = useKeycloak()

    return (
        <ModuleCreationForm
            getToken={() => keycloak.token}
            onSuccess={() => navigate({ to: '/content-manager/modules' as never })}
            onBack={() => navigate({ to: '/content-manager/modules' as never })}
        />
    )
}
