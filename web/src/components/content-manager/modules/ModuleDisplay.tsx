import { useEffect, useState, useCallback } from 'react'
import { motion, LayoutGroup, AnimatePresence } from 'motion/react'
import { BookOpen, AlertCircle } from 'lucide-react'
import { useKeycloak } from '@react-keycloak/web'
import { fetchModules, deleteModule, type Module } from '@/services/modulesApi'
import { useDebounce } from '@/lib/useDebounce'
import type { GridCols } from '@/components/courses/UniversalFilters'
import { cn } from '@/lib/utils'
import { ModuleCard } from '@/components/modules/ModuleCard'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'


const API_BASE = import.meta.env.VITE_API_URL as string
type ModuleSortValue = 'newest' | 'oldest' | 'title_asc' | 'title_desc'

const gridClass: Record<GridCols, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

// ── Skeleton card ──────────────────────────────────────────────────────────────

function ModuleCardSkeleton({ layout = 'grid' }: { readonly layout?: 'grid' | 'list' }) {
    const isList = layout === 'list'
    return (
        <div className={cn(
            "flex bg-surface rounded-2xl overflow-hidden border border-border animate-pulse",
            isList ? "flex-row h-44" : "flex-col"
        )}>
            <div className={cn(
                "bg-surface-subtle",
                isList ? "w-72 h-full" : "h-48 w-full"
            )} />
            <div className="p-5 flex flex-col flex-1 gap-3">
                <div className="h-4 bg-surface-subtle rounded w-3/4" />
                <div className="h-3 bg-surface-subtle rounded w-full" />
                <div className="h-3 bg-surface-subtle rounded w-2/3" />
                <div className="mt-auto pt-4 border-t border-border flex justify-between">
                    <div className="h-3 bg-surface-subtle rounded w-1/3" />
                    <div className="h-3 bg-surface-subtle rounded w-1/4" />
                </div>
            </div>
        </div>
    )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ModuleDisplayProps {
    readonly search?: string
    readonly sort?: ModuleSortValue
    readonly cols?: GridCols
    readonly onResultCountChange?: (count: number) => void
}

export function ModuleDisplay({ search = '', sort = 'newest', cols = 3, onResultCountChange }: ModuleDisplayProps) {
    const { keycloak } = useKeycloak()
    const navigate = useNavigate()
    const [modules, setModules] = useState<Module[]>([])
    const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const debouncedSearch = useDebounce(search, 400)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const result = await fetchModules({
                    token: keycloak.token,
                    search: debouncedSearch.trim() || undefined,
                    sort,
                })
                if (!cancelled) {
                    setModules(result.items)
                    onResultCountChange?.(result.total)
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load modules')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void load()
        return () => { cancelled = true }
    }, [keycloak.token, debouncedSearch, sort])

    useEffect(() => {
        let cancelled = false
        const coverIds = Array.from(new Set(modules.map((mod) => mod.cover_image).filter(Boolean))) as string[]

        if (coverIds.length === 0) {
            setCoverUrls({})
            return
        }

        async function loadCoverUrls() {
            const entries = await Promise.all(
                coverIds.map(async (coverId) => {
                    try {
                        const res = await fetch(`${API_BASE}/content/${encodeURIComponent(coverId)}/file-url`, {
                            headers: {
                                Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
                            },
                        })
                        if (!res.ok) return [coverId, ''] as const
                        const payload = await res.json() as { url: string | null }
                        return [coverId, payload.url ?? ''] as const
                    } catch {
                        return [coverId, ''] as const
                    }
                })
            )

            if (!cancelled) {
                setCoverUrls(Object.fromEntries(entries.filter(([, value]) => value)))
            }
        }

        void loadCoverUrls()
        return () => { cancelled = true }
    }, [modules, keycloak.token])

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteModule(id, keycloak.token)
            setModules(prev => prev.filter(m => m.id !== id))
            toast.success('Module deleted successfully')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete module')
        }
    }, [keycloak.token])

    if (loading) {
        return (
            <motion.div animate={{ opacity: 1 }} className="w-full h-full">
                <div className={cn("grid gap-8", gridClass[cols], cols === 1 && "gap-4")}>
                    {Array.from({ length: 6 }, (_, i) => <ModuleCardSkeleton key={`sk-${i}`} layout={cols === 1 ? 'list' : 'grid'} />)}
                </div>
            </motion.div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                <AlertCircle className="w-8 h-8 text-red-100" />
                <p className="text-sm font-medium text-red-100">{error}</p>
                <button
                    type="button"
                    onClick={() => globalThis.location.reload()}
                    className="text-xs text-accent-secondary hover:text-primary transition-colors"
                >
                    Try again
                </button>
            </div>
        )
    }

    if (modules.length === 0) {
        const isFiltered = debouncedSearch.trim() !== ''
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                {isFiltered ? (
                    <>
                        <p className="text-sm font-medium text-foreground">No modules match "{debouncedSearch}"</p>
                        <p className="text-xs text-muted-foreground">Try a different search term.</p>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-medium text-foreground">No modules yet</p>
                        <p className="text-xs text-muted-foreground">Create your first module to get started.</p>
                    </>
                )}
            </div>
        )
    }

    return (
        <LayoutGroup>
            <motion.div layout className={cn("grid gap-8", gridClass[cols], cols === 1 && "gap-4")}>
                <AnimatePresence mode="popLayout">
                    {modules.map(mod => (
                        <motion.div
                            key={mod.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                                layout: { type: 'spring', stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                                scale: { duration: 0.15 },
                            }}
                        >
                            <ModuleCard
                                title={mod.title}
                                category={mod.category}
                                description={mod.description}
                                coverImage={mod.cover_image ? coverUrls[mod.cover_image] : undefined}
                                estimatedTime={mod.estimated_time ? `${mod.estimated_time} min` : undefined}
                                difficulty={mod.difficulty}
                                onClick={() => navigate({ to: '/content-manager/modules/$moduleId', params: { moduleId: mod.id } } as any)}
                                onEdit={() => navigate({ to: '/content-manager/modules/$moduleId', params: { moduleId: mod.id } } as any)}
                                onPreview={() => navigate({ to: '/content-manager/modules/$moduleId', params: { moduleId: mod.id }, search: { preview: true } } as any)}
                                onDelete={() => handleDelete(mod.id)}
                                layout={cols === 1 ? 'list' : 'grid'}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </LayoutGroup>
    )
}
