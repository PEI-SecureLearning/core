import { createFileRoute } from '@tanstack/react-router'
import { ContentPageLayout } from '@/components/content-manager/ContentPageLayout'
import { ModuleDisplay } from '@/components/content-manager/ModuleDisplay'

export const Route = createFileRoute('/content-manager/modules')({
    component: RouteComponent,
})

function RouteComponent() {
    return <ContentPageLayout title="Modules"><ModuleDisplay /></ContentPageLayout>
}
