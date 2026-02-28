import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/courses/')({
    component: CourseIndex,
})

function CourseIndex() {
    return <div>Course Index</div>
}
