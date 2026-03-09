import { createFileRoute } from '@tanstack/react-router'
import { useKeycloak } from '@react-keycloak/web'
import CourseList from '@/components/courses/courseList'


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
