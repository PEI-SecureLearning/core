import { createFileRoute } from '@tanstack/react-router'
import { ContentPageLayout } from '@/components/content-manager/shared/ContentPageLayout'
import { CourseDisplay } from '@/components/content-manager/courses/CourseDisplay'

export const Route = createFileRoute('/content-manager/courses')({
    component: RouteComponent,
})

function RouteComponent() {
    return <ContentPageLayout title="Courses"><CourseDisplay /></ContentPageLayout>
}
