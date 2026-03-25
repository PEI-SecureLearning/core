import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BookOpen, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import { fetchCourse, type Course } from '@/services/coursesApi'
import { fetchModule, type Module } from '@/services/modulesApi'
import { CourseCreator } from '@/components/content-manager/courses/CourseCreator'

export const Route = createFileRoute('/content-manager/courses_/$courseId_/edit')({
    component: RouteComponent,
})

function RouteComponent() {
    const { courseId } = Route.useParams()
    const navigate = useNavigate()
    const { keycloak } = useKeycloak()

    const [course, setCourse] = useState<Course | null>(null)
    const [modules, setModules] = useState<Module[]>([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        let cancelled = false
        setLoading(true)

        async function load() {
            try {
                const c = await fetchCourse(courseId, keycloak.token)
                if (cancelled) return
                setCourse(c)

                if (c.modules.length > 0) {
                    const mods = await Promise.all(
                        c.modules.map(id => fetchModule(id, keycloak.token))
                    )
                    if (cancelled) return
                    setModules(mods)
                }
            } catch {
                if (!cancelled) setNotFound(true)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        
        void load()
        return () => { cancelled = true }
    }, [courseId, keycloak.token])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (notFound || !course) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-3 text-muted-foreground py-20 bg-background">
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

    return (
        <CourseCreator
            initialCourse={course}
            initialModules={modules}
            isEditing={true}
            onBack={() => navigate({ to: '/content-manager/courses/$courseId', params: { courseId } })}
            onPublished={() => navigate({ to: '/content-manager/courses/$courseId', params: { courseId } })}
        />
    )
}
