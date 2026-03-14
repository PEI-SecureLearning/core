import { createFileRoute, Link } from '@tanstack/react-router'
import { BookOpen, ChevronRight } from 'lucide-react'
import { COURSES } from '@/components/courses/courseData'
import ModuleLearner from '@/components/courses/ModuleLearner'

export const Route = createFileRoute('/courses/$courseId/modules/$moduleId')({
    component: ModuleLearnerRoute,
})

function ModuleLearnerRoute() {
    const { courseId, moduleId } = Route.useParams()
    const course = COURSES.find(c => c.id === courseId)
    const mod = course?.modules.find(m => m.id === moduleId)

    if (!course || !mod) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <BookOpen size={48} className="mb-4 text-muted-foreground/50" />
                <h2 className="text-xl font-semibold text-foreground">Module not found</h2>
                <p className="text-sm mt-1">The module you're looking for doesn't exist.</p>
                <Link to="/courses" className="mt-4 text-sm text-primary hover:text-primary font-medium">
                    ← Back to courses
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground px-6 pt-4 pb-2 flex-shrink-0 bg-background border-b border-border/40">
                <Link to="/courses" className="hover:text-primary transition-colors">
                    Courses
                </Link>
                <ChevronRight size={14} className="text-muted-foreground/70" />
                <Link
                    to={'/courses/$courseId' as any}
                    params={{ courseId } as any}
                    className="hover:text-primary transition-colors"
                >
                    {course.title}
                </Link>
                <ChevronRight size={14} className="text-muted-foreground/70" />
                <span className="text-foreground font-medium truncate max-w-xs">{mod.title}</span>
            </nav>

            {/* Module learner */}
            <div className="flex-1 overflow-hidden">
                <ModuleLearner module={mod} courseId={courseId} />
            </div>
        </div>
    )
}
