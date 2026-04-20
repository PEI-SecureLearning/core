import { useDraggable } from '@dnd-kit/core'
import { Search, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import { fetchModules, type Module } from '@/services/modulesApi'
import { DIFFICULTY_COLORS } from '../modules/module-creation/constants'
import { Clock, Blocks } from 'lucide-react'

interface AvailableModuleListProps {
    readonly selectedIds: string[]
}

function DraggableModule({
    module,
    isDimmed,
    coverUrl
}: {
    readonly module: Module
    readonly isDimmed: boolean
    readonly coverUrl?: string
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `library-${module.id}`,
        data: { module },
    })

    const difficultyColor = DIFFICULTY_COLORS[module.difficulty ?? 'Easy'] ?? DIFFICULTY_COLORS['Easy']

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
        >
            <div
                className={`flex items-center gap-3 p-3 rounded-xl border bg-surface transition-all ${isDimmed
                    ? 'opacity-40 border-border'
                    : 'border-border hover:border-[#7C3AED]/40 hover:shadow-md hover:shadow-[#7C3AED]/10'
                    }`}
            >
                {coverUrl ? (
                    <img src={coverUrl} alt={module.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0">
                        <Blocks className="w-5 h-5 text-white/70" />
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
            </div>
        </div>
    )
}

export function AvailableModuleList({ selectedIds }: AvailableModuleListProps) {
    const { keycloak } = useKeycloak()
    const [search, setSearch] = useState('')
    const [modules, setModules] = useState<Module[]>([])
    const [loading, setLoading] = useState(true)
    const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})

    const API_BASE = import.meta.env.VITE_API_URL as string

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        fetchModules({ token: keycloak.token, limit: 100 })
            .then((data) => { if (!cancelled) setModules(data.items) })
            .catch(() => undefined)
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [keycloak.token])

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
    }, [modules, keycloak.token, API_BASE])

    const filtered = modules.filter((m) =>
        (m.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (m.category ?? '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Module Library
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search modules..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">
                        No modules found
                    </p>
                ) : (
                    filtered.map((mod) => (
                        <DraggableModule
                            key={mod.id}
                            module={mod}
                            isDimmed={selectedIds.includes(mod.id)}
                            coverUrl={mod.cover_image ? coverUrls[mod.cover_image] : undefined}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
