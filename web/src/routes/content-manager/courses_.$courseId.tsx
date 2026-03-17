import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BookOpen, Loader2, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import { fetchCourse, type Course } from '@/services/coursesApi'

export const Route = createFileRoute('/content-manager/courses_/$courseId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { courseId } = Route.useParams()
    const navigate = useNavigate()
    const { keycloak } = useKeycloak()

    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

    const API_BASE = import.meta.env.VITE_API_URL as string

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        fetchCourse(courseId, keycloak.token)
            .then((c) => {
                if (!cancelled) { setCourse(c); setLoading(false) }
            })
            .catch(() => {
                if (!cancelled) { setNotFound(true); setLoading(false) }
            })
        return () => { cancelled = true }
    }, [courseId, keycloak.token])

    // Resolve cover image presigned URL
    useEffect(() => {
        if (!course?.cover_image) return
        let cancelled = false
        fetch(`${API_BASE}/content/${encodeURIComponent(course.cover_image)}/file-url`, {
            headers: { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '' },
        })
            .then(r => r.json() as Promise<{ url: string | null }>)
            .then(d => { if (!cancelled && d.url) setCoverImageUrl(d.url) })
            .catch(() => undefined)
        return () => { cancelled = true }
    }, [course?.cover_image, keycloak.token, API_BASE])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (notFound || !course) {
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

    const DIFFICULTY_COLOR: Record<string, string> = {
        Easy:   'bg-green-500/15 text-green-400 border-green-500/30',
        Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
        Hard:   'bg-red-500/15 text-red-400 border-red-500/30',
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate({ to: '/content-manager/courses' })}
                        className="text-sm text-muted-foreground hover:text-[#A78BFA] transition-colors"
                    >
                        ← Back
                    </button>
                    <div className="h-4 w-px bg-border" />
                    <h1 className="text-lg font-bold text-foreground truncate">{course.title}</h1>
                </div>
                <button
                    type="button"
                    onClick={() => navigate({ to: '/content-manager/courses/new' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-[#7C3AED]/40 transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                </button>
            </div>

            {/* Cover image */}
            {coverImageUrl && (
                <div className="w-full h-52 overflow-hidden">
                    <img src={coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                </div>
            )}

            {/* Course metadata */}
            <div className="px-6 py-6 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${DIFFICULTY_COLOR[course.difficulty] ?? 'bg-surface-subtle text-muted-foreground border-border'}`}>
                        {course.difficulty}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground bg-surface-subtle px-2.5 py-1 rounded-lg border border-border">
                        {course.category}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground bg-surface-subtle px-2.5 py-1 rounded-lg border border-border">
                        ⏱ {course.expected_time}
                    </span>
                </div>

                {course.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
                )}

                {/* Module list */}
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        Modules ({course.modules.length})
                    </h2>
                    {course.modules.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No modules added to this course yet.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {course.modules.map((moduleId, index) => (
                                <div
                                    key={moduleId}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface"
                                >
                                    <span className="w-7 h-7 rounded-lg bg-[#7C3AED]/15 flex items-center justify-center text-xs font-bold text-[#A78BFA] flex-shrink-0">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm text-muted-foreground font-mono">{moduleId}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
