import { createFileRoute } from '@tanstack/react-router'
import CourseList from '@/components/courses/courseList'

export const Route = createFileRoute('/courses/')({
    component: CourseIndex,
})

function CourseIndex() {
    return <CourseList />
}
