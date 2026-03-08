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
            <div className="flex flex-col items-center justify-center h-full w-full gap-3 text-slate-400 py-20">
                <BookOpen className="w-10 h-10 text-slate-200" />
                <p className="text-lg font-semibold text-slate-700">Course not found</p>
                <button
                    type="button"
                    onClick={() => navigate({ to: '/content-manager/courses' })}
                    className="text-sm text-purple-600 hover:text-purple-800 transition-colors"
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
        <div className="h-full w-full bg-slate-50 relative overflow-hidden">
            <CoursePreview
                title={course.title}
                modules={fullModules}
                onClose={() => navigate({ to: '/content-manager/courses' })}
            />
        </div>
    )
}
