import { createFileRoute } from '@tanstack/react-router'
import CourseList from '@/components/courses/courseList'

export const Route = createFileRoute('/courses/manage')({
    component: ManageCoursesComponent,
})

function ManageCoursesComponent() {
    return (
        <CourseList
            showNewCourse={false}
            hideControls={true}
            basePath="/courses/manage"
        />
    )
}
