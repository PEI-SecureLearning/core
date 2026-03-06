import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { BookOpen, ChevronRight } from 'lucide-react'
import { COURSES } from '@/components/courses/courseData'
import CourseHeader from '@/components/courses/CourseHeader'
import ModuleCard from '@/components/courses/ModuleCard'

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

    const overallProgress = course.modules.length
        ? Math.round(course.modules.reduce((sum, m) => sum + m.completion, 0) / course.modules.length)
        : 0

    return (
        <div className="p-6 space-y-6 h-full w-full overflow-y-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-gray-500">
                <Link
                    to="/content-manager/courses"
                    className="hover:text-purple-600 transition-colors"
                >
                    Courses
                </Link>
                <ChevronRight size={14} className="text-gray-400" />
                <span className="text-gray-800 font-medium">{course.title}</span>
            </nav>

            {/* Hero header */}
            <CourseHeader course={course} overallProgress={overallProgress} />

            {/* Module list */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Modules ({course.modules.length})
                </h2>
                {course.modules.map(mod => (
                    <ModuleCard key={mod.id} module={mod} />
                ))}
            </div>
        </div>
    )
}
