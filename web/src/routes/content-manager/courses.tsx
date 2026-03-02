import { createFileRoute } from '@tanstack/react-router'
import { ContentPageLayout } from '@/components/content-manager/ContentPageLayout'
import { CourseDisplay } from '@/components/content-manager/CourseDisplay'

export const Route = createFileRoute('/content-manager/courses')({
    component: RouteComponent,
})

function RouteComponent() {
    return <ContentPageLayout title="Courses"><CourseDisplay /></ContentPageLayout>
}
