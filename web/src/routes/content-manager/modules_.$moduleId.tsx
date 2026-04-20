import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useKeycloak } from '@react-keycloak/web'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ModuleCreationForm } from '@/components/content-manager/modules/module-creation'
import { fetchModule, type Module } from '@/services/modulesApi'
import type { ModuleFormData, Section, Block } from '@/components/content-manager/modules/module-creation/types'

export const Route = createFileRoute('/content-manager/modules_/$moduleId')({
    validateSearch: (search: Record<string, unknown>) => ({
        preview: Boolean(search.preview),
    }),
    component: RouteComponent,
})

/** Map the snake_case API Module back to the camelCase ModuleFormData the UI expects. */
function toFormData(m: Module): ModuleFormData {
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
                    url: '',         // fetched lazily by RichContentBlockEditor
                    contentId: b.url,      // backend stores content_piece_id in url field
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
        coverImage: '',                  // empty — lazy-fetched by DetailsSidebar useEffect
        coverImageId: m.cover_image ?? '',
        estimatedTime: m.estimated_time,
        difficulty: (m.difficulty as ModuleFormData['difficulty']) ?? 'Easy',
        hasRefreshModule: m.has_refresh_module,
        sections: m.sections.map(mapSection),
        refreshSections: m.refresh_sections.map(mapSection),
    }
}

function RouteComponent() {
    const { moduleId } = Route.useParams()
    const { preview } = Route.useSearch()
    const navigate = useNavigate()
    const { keycloak } = useKeycloak()

    const [formData, setFormData] = useState<ModuleFormData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const mod = await fetchModule(moduleId, keycloak.token)
                if (!cancelled) setFormData(toFormData(mod))
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load module')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void load()
        return () => { cancelled = true }
    }, [moduleId, keycloak.token])

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <Loader2 className="w-8 h-8 animate-spin text-[#A78BFA]" />
            </div>
        )
    }

    if (error || !formData) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-3 text-muted-foreground py-20">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm font-medium text-red-400">{error ?? 'Module not found'}</p>
                <button
                    type="button"
                    onClick={() => navigate({ to: '/content-manager/modules' })}
                    className="text-sm text-[#A78BFA] hover:text-[#7C3AED] transition-colors"
                >
                    ← Back to Modules
                </button>
            </div>
        )
    }

    return (
        <ModuleCreationForm
            getToken={() => keycloak.token}
            initialData={formData}
            initialModuleId={moduleId}
            initialPreview={preview}
            onBack={() => navigate({ to: '/content-manager/modules' })}
            onSuccess={() => navigate({ to: '/content-manager/modules' })}
        />
    )
}