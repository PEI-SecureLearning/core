import { createFileRoute, Link } from '@tanstack/react-router'
import { BookOpen, ChevronRight } from 'lucide-react'
import { COURSES } from '@/components/courses/courseData'
import CourseHeader from '@/components/courses/CourseHeader'
import ModuleCard from '@/components/courses/ModuleCard'

export const Route = createFileRoute('/courses/$courseId')({
    component: CourseDetail,
})

function CourseDetail() {
    const { courseId } = Route.useParams()
    const course = COURSES.find(c => c.id === courseId)

    if (!course) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full text-center text-gray-500">
                <BookOpen size={48} className="mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold text-gray-800">Course not found</h2>
                <p className="text-sm mt-1">The course you're looking for doesn't exist.</p>
                <Link to="/courses" className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium">
                    ← Back to courses
                </Link>
            </div>
        )
    }

    const overallProgress = course.modules.length
        ? Math.round(course.modules.reduce((sum, m) => sum + m.completion, 0) / course.modules.length)
        : 0

    return (
        <div className="p-6 space-y-6 h-full w-full overflow-y-auto overflow-y-hidden">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-gray-500 h-[2%]">
                <Link to="/courses" className="hover:text-purple-600 transition-colors">
                    Courses
                </Link>
                <ChevronRight size={14} className="text-gray-400" />
                <span className="text-gray-800 font-medium">{course.title}</span>
            </nav>

            {/* Hero header */}
            <CourseHeader course={course} overallProgress={overallProgress} />

            {/* Module list */}
            <div className="h-[57%] space-y-4 pl-6 pr-1 overflow-y-auto flex flex-col z-0 translate-y-[-10%]">
                <div style={{ visibility: 'hidden', width: '100px', height: '50px', backgroundColor: 'red' }}>
                    .
                </div>
                {course.modules.map(mod => (
                    <ModuleCard key={mod.id} module={mod} />
                ))}
            </div>
        </div>
    )
}
