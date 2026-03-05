import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import { ModuleCreationForm } from '@/components/content-manager/ModuleCreationForm'
import { useNavigationLoading } from '@/lib/navigation-loading'

export const Route = createFileRoute('/content-manager/modules_/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()
    const { keycloak } = useKeycloak()
    const { beginFadeOut } = useNavigationLoading()

    // The overlay is already fully opaque when this page mounts (navigation
    // happened after the fade-in completed). Start fading out immediately so
    // the form is revealed as soon as it's ready.
    useEffect(() => {
        beginFadeOut()
    }, [beginFadeOut])

    return (
        <ModuleCreationForm
            token={keycloak.token}
            onSuccess={() => navigate({ to: '/content-manager/modules' as never })}
            onBack={() => navigate({ to: '/content-manager/modules' as never })}
        />
    )
}
