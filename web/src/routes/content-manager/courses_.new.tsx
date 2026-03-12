import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CourseCreator } from '@/components/content-manager/courses/CourseCreator'

export const Route = createFileRoute('/content-manager/courses_/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()

    return (
        <CourseCreator
            onBack={() => navigate({ to: '/content-manager/courses' })}
        />
    )
}
