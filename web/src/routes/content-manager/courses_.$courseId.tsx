import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { COURSES } from '@/components/courses/courseData'
import { CoursePreview } from '@/components/content-manager/courses/course-creation/CoursePreview'
import type { PlaceholderModule } from '@/components/content-manager/modules/module-creation/placeholderModules'

export const Route = createFileRoute('/content-manager/courses_/$courseId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { courseId } = Route.useParams()
    const navigate = useNavigate()
    const course = COURSES.find(c => c.id === courseId)

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-3 text-muted-foreground py-20">
                <BookOpen className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-lg font-semibold text-foreground">Course not found</p>
                <button
                    type="button"
                    onClick={() => navigate({ to: '/content-manager/courses' })}
                    className="text-sm text-[#A78BFA] hover:text-[#7C3AED] transition-colors"
                >
                    ← Back to Courses
                </button>
            </div>
        )
    }

    // Use the modules directly from the course data.
    // We'll update the courseData.ts to ensure these are compatible with what CoursePreview expects.
    const fullModules = course.modules as any as PlaceholderModule[]

    return (
        <div className="h-full w-full bg-background relative overflow-hidden">
            <CoursePreview
                title={course.title}
                modules={fullModules}
                onClose={() => navigate({ to: '/content-manager/courses' })}
            />
        </div>
    )
}
