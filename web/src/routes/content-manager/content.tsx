import { createFileRoute } from '@tanstack/react-router'
import { ContentPageLayout } from '@/components/content-manager/ContentPageLayout'
import { ContentDisplay } from '@/components/content-manager/ContentDisplay'

export const Route = createFileRoute('/content-manager/content')({
    component: RouteComponent,
})

function RouteComponent() {
    return <ContentPageLayout title="Content"><ContentDisplay /></ContentPageLayout>
}
