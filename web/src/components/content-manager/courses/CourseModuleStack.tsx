import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Blocks, Clock, GripVertical, Layers, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import { DIFFICULTY_COLORS } from '../modules/module-creation/constants'
import type { Module } from '@/services/modulesApi'

const API_BASE = import.meta.env.VITE_API_URL as string

interface CourseModuleStackProps {
    readonly modules: Module[]
    readonly onRemove: (index: number) => void
}

function SortableModuleCard({
    module,
    index,
    onRemove,
    coverUrl
}: {
    readonly module: Module
    readonly index: number
    readonly onRemove: () => void
    readonly coverUrl?: string
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `stack-${index}` })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    }

    const difficultyColor = DIFFICULTY_COLORS[module.difficulty ?? 'Easy'] ?? DIFFICULTY_COLORS['Easy']

    return (
        <div ref={setNodeRef} style={style}>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:border-[#7C3AED]/40 hover:shadow-md hover:shadow-[#7C3AED]/10 transition-all">
                <div {...attributes} {...listeners} className="flex-shrink-0 text-muted-foreground/40 hover:text-[#A78BFA] cursor-grab active:cursor-grabbing transition-colors">
                    <GripVertical className="w-4 h-4" />
                </div>

                {coverUrl ? (
                    <img src={coverUrl} alt={module.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0">
                        <Blocks className="w-4 h-4 text-white/70" />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{module.title || 'Untitled'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {module.category && (
                            <span className="text-[10px] font-medium text-[#A78BFA] bg-[#7C3AED]/15 px-1.5 py-0.5 rounded">
                                {module.category}
                            </span>
                        )}
                        {module.difficulty && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${difficultyColor}`}>
                                {module.difficulty}
                            </span>
                        )}
                    </div>
                </div>

                <span className="flex items-center gap-1 text-[11px] text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {module.estimated_time ? `${module.estimated_time}m` : '—'}
                </span>

                <button
                    type="button"
                    onClick={onRemove}
                    className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

export function CourseModuleStack({ modules, onRemove }: CourseModuleStackProps) {
    const { keycloak } = useKeycloak()
    const { setNodeRef, isOver } = useDroppable({ id: 'course-stack' })
    const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})

    useEffect(() => {
        let cancelled = false
        const coverIds = Array.from(new Set(modules.map(m => m.cover_image).filter(Boolean))) as string[]
        if (coverIds.length === 0) {
            setCoverUrls({})
            return
        }
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
            if (!cancelled) setCoverUrls(Object.fromEntries(entries.filter(([, v]) => v)))
        }).catch(() => undefined)
        return () => { cancelled = true }
    }, [modules, keycloak.token])

    const sortableIds = modules.map((_, i) => `stack-${i}`)
    const moduleSuffix = modules.length === 1 ? '' : 's'
    const moduleCountLabel = modules.length === 0
        ? 'Drag modules here to build your course'
        : `${modules.length} module${moduleSuffix} added`

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground mb-1">Course Modules</h2>
                <p className="text-[11px] text-muted-foreground">{moduleCountLabel}</p>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto px-4 pb-4 transition-colors duration-200 ${isOver ? 'bg-[#7C3AED]/5' : ''}`}
            >
                {modules.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-full gap-3 border-2 border-dashed rounded-xl transition-colors duration-200 ${isOver ? 'border-[#7C3AED]/60 bg-[#7C3AED]/5' : 'border-border'}`}>
                        <Layers className="w-10 h-10 text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground font-medium">Drop modules here</p>
                        <p className="text-xs text-muted-foreground/50">Drag from the library on the right</p>
                    </div>
                ) : (
                    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-2">
                            {modules.map((mod, i) => (
                                <SortableModuleCard
                                    key={`stack-${mod.id}-${i}`}
                                    module={mod}
                                    index={i}
                                    onRemove={() => onRemove(i)}
                                    coverUrl={mod.cover_image ? coverUrls[mod.cover_image] : undefined}
                                />
                            ))}
                        </div>
                    </SortableContext>
                )}
            </div>
        </div>
    )
}
