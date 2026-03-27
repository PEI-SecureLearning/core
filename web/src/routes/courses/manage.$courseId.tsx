import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BookOpen, Loader2, Clock, Blocks } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import { fetchCourse, type Course } from '@/services/coursesApi'
import { fetchModule, type Module as ApiModule } from '@/services/modulesApi'
import { DIFFICULTY_COLORS } from '@/components/content-manager/modules/module-creation/constants'
import { ModulePreview } from '@/components/content-manager/modules/module-creation/preview/ModulePreview'
import type { ModuleFormData, Section, Block } from '@/components/content-manager/modules/module-creation/types'

export const Route = createFileRoute('/courses/manage/$courseId')({
    component: RouteComponent,
})

/** Map API Module back to ModuleFormData for previewing. */
function toFormData(m: ApiModule): ModuleFormData {
    const mapSection = (s: (typeof m.sections)[number]): Section => ({
        id: s.id,
        title: s.title,
        collapsed: s.collapsed,
        requireCorrectAnswers: s.require_correct_answers,
        isOptional: s.is_optional,
        minTimeSpent: s.min_time_spent,
        blocks: s.blocks.map((b): Block => {
            if (b.kind === 'text') {
                return { id: b.id, kind: 'text', content: b.content }
            }
            if (b.kind === 'rich_content') {
                return {
                    id: b.id,
                    kind: 'rich_content',
                    mediaType: b.media_type,
                    url: '',         // populated by resolver
                    contentId: b.url,  // backend stores ID in url field
                    caption: b.caption,
                }
            }
            return {
                id: b.id,
                kind: 'question',
                question: {
                    id: b.question.id,
                    type: b.question.type,
                    text: b.question.text,
                    answer: b.question.answer,
                    choices: b.question.choices.map(c => ({
                        id: c.id,
                        text: c.text,
                        isCorrect: c.is_correct,
                    })),
                },
            }
        }),
    })

    return {
        title: m.title,
        category: m.category,
        description: m.description,
        coverImage: '',
        coverImageId: m.cover_image ?? '',
        estimatedTime: m.estimated_time,
        difficulty: (m.difficulty as ModuleFormData['difficulty']) ?? 'Easy',
        hasRefreshModule: m.has_refresh_module,
        sections: m.sections.map(mapSection),
        refreshSections: m.refresh_sections.map(mapSection),
    }
}

function RouteComponent() {
    const { courseId } = Route.useParams()
    const navigate = useNavigate()
    const { keycloak } = useKeycloak()

    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
    const [modules, setModules] = useState<ApiModule[]>([])
    const [moduleCoverUrls, setModuleCoverUrls] = useState<Record<string, string>>({})

    const [selectedModule, setSelectedModule] = useState<ModuleFormData | null>(null)
    const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null)

    const API_BASE = import.meta.env.VITE_API_URL as string

    // Resolve all media URLs in a module for preview
    const handlePreviewModule = async (mod: ApiModule) => {
        setPreviewLoadingId(mod.id)
        const headers = { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '' }
        const formData = toFormData(mod)

        const resolveBlock = async (b: Block): Promise<Block> => {
            if (b.kind === 'rich_content' && b.contentId) {
                try {
                    const res = await fetch(`${API_BASE}/content/${encodeURIComponent(b.contentId)}/file-url`, { headers })
                    if (res.ok) {
                        const d = await res.json()
                        return { ...b, url: d.url || '' }
                    }
                } catch { /* ignore */ }
            }
            return b
        }

        const resolveSection = async (s: Section): Promise<Section> => ({
            ...s,
            blocks: await Promise.all(s.blocks.map(resolveBlock))
        })

        try {
            // Resolve cover if exists
            let coverUrl = ''
            if (formData.coverImageId) {
                const res = await fetch(`${API_BASE}/content/${encodeURIComponent(formData.coverImageId)}/file-url`, { headers })
                if (res.ok) {
                    const d = await res.json()
                    coverUrl = d.url || ''
                }
            }

            const resolved: ModuleFormData = {
                ...formData,
                coverImage: coverUrl,
                sections: await Promise.all(formData.sections.map(resolveSection)),
                refreshSections: await Promise.all((formData.refreshSections ?? []).map(resolveSection))
            }
            setSelectedModule(resolved)
        } catch {
            setSelectedModule(formData)
        } finally {
            setPreviewLoadingId(null)
        }
    }

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

    // Fetch full module details
    useEffect(() => {
        if (!course?.modules.length) return
        let cancelled = false
        Promise.all(course.modules.map(id => fetchModule(id, keycloak.token)))
            .then(res => { if (!cancelled) setModules(res) })
            .catch(() => undefined)
        return () => { cancelled = true }
    }, [course?.modules, keycloak.token])

    // Load cover images for the modules
    useEffect(() => {
        if (!modules.length) return
        let cancelled = false
        const coverIds = Array.from(new Set(modules.map(m => m.cover_image).filter(Boolean))) as string[]
        if (!coverIds.length) return
        const headers = { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '' }
        Promise.all(
            coverIds.map(async (id) => {
                try {
                    const res = await fetch(`${API_BASE}/content/${encodeURIComponent(id)}/file-url`, { headers })
                    if (!res.ok) return [id, ''] as const
                    const data = await res.json() as { url: string | null }
                    return [id, data.url ?? ''] as const
                } catch {
                    return [id, ''] as const
                }
            })
        ).then(entries => {
            if (!cancelled) setModuleCoverUrls(Object.fromEntries(entries.filter(([, v]) => v)))
        }).catch(() => undefined)
        return () => { cancelled = true }
    }, [modules, keycloak.token, API_BASE])

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
                    onClick={() => navigate({ to: '/courses/manage' })}
                    className="text-sm text-[#A78BFA] hover:text-[#7C3AED] transition-colors"
                >
                    ← Back to Courses
                </button>
            </div>
        )
    }

    const DIFFICULTY_COLOR: Record<string, string> = {
        Easy: 'bg-green-500/15 text-green-400 border-green-500/30',
        Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
        Hard: 'bg-red-500/15 text-red-400 border-red-500/30',
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate({ to: '/courses/manage' })}
                        className="text-sm text-muted-foreground hover:text-[#A78BFA] transition-colors"
                    >
                        ← Back
                    </button>
                    <div className="h-4 w-px bg-border" />
                    <h1 className="text-lg font-bold text-foreground truncate">{course.title}</h1>
                </div>
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
                        <div className="flex flex-col gap-3">
                            {modules.map((mod, index) => {
                                const diffColor = DIFFICULTY_COLORS[mod.difficulty ?? 'Easy'] ?? DIFFICULTY_COLORS['Easy']
                                const coverUrl = mod.cover_image ? moduleCoverUrls[mod.cover_image] : undefined
                                const isPreloading = previewLoadingId === mod.id

                                return (
                                    <button
                                        key={mod.id}
                                        type="button"
                                        onClick={() => void handlePreviewModule(mod)}
                                        className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border/60 bg-surface/50 hover:bg-surface hover:border-primary/40 hover:shadow-md transition-all duration-200 group relative text-left"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-colors ${isPreloading ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground/80 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                            {isPreloading ? <Loader2 className="w-4 h-4 animate-spin" /> : index + 1}
                                        </div>

                                        {coverUrl ? (
                                            <img src={coverUrl} alt={mod.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-border/20 shadow-sm" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-linear-to-br from-muted to-muted/40 flex items-center justify-center flex-shrink-0">
                                                <Blocks className="w-7 h-7 text-muted-foreground/30" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-foreground truncate tracking-tight group-hover:text-primary transition-colors">{mod.title || 'Untitled Module'}</p>
                                            <div className="flex items-center gap-2.5 mt-1.5 font-medium">
                                                {mod.category && (
                                                    <span className="text-[10px] font-bold text-[#A78BFA] bg-purple-500/10 px-2 py-0.5 rounded shadow-xs">
                                                        {mod.category}
                                                    </span>
                                                )}
                                                {mod.difficulty && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${diffColor}`}>
                                                        {mod.difficulty}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <Clock size={14} className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                                            <span className="text-[10px] font-bold text-muted-foreground/80 tabular-nums">
                                                {mod.estimated_time ? `${mod.estimated_time}m` : '—'}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {selectedModule && (
                <ModulePreview
                    data={selectedModule}
                    onClose={() => setSelectedModule(null)}
                />
            )}
        </div>
    )
}
