import { createFileRoute } from '@tanstack/react-router'
import UserCourseList from '@/components/courses/userCourseList'

export const Route = createFileRoute('/courses/')({
    component: CourseIndex,
})

function CourseIndex() {
    return <UserCourseList />
}
