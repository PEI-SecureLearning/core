import { createFileRoute } from '@tanstack/react-router'
import { useKeycloak } from '@react-keycloak/web'
import CourseList from '@/components/courses/courseList'
import { ContentPageLayout } from '@/components/content-manager/shared/ContentPageLayout'
import { CourseDisplay } from '@/components/content-manager/courses/CourseDisplay'

export const Route = createFileRoute('/content-manager/courses')({
    component: RouteComponent,
})

function RouteComponent() {
    const { keycloak } = useKeycloak()

    const userRoles = keycloak.tokenParsed?.realm_access?.roles ?? []
    const isContentManager = userRoles.includes('CONTENT_MANAGER')

    return (
        <CourseList
            showNewCourse={isContentManager}
            basePath="/content-manager/courses"
        />
    )
}
