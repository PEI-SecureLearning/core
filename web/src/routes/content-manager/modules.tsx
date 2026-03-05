import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ContentPageLayout } from '@/components/content-manager/ContentPageLayout'
import { ModuleDisplay } from '@/components/content-manager/ModuleDisplay'
import { useNavigationLoading } from '@/lib/navigation-loading'

export const Route = createFileRoute('/content-manager/modules')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()
    const { triggerLoading } = useNavigationLoading()

    const handleNewModule = () => {
        triggerLoading(() => navigate({ to: '/content-manager/modules/new' as never }))
    }

    return (
        <ContentPageLayout title="Modules" onNew={handleNewModule}>
            <ModuleDisplay />
        </ContentPageLayout>
    )
}
