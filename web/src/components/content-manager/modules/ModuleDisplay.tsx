import { useEffect, useState } from 'react'
import { motion, LayoutGroup, AnimatePresence } from 'motion/react'
import { BookOpen, AlertCircle } from 'lucide-react'
import { useKeycloak } from '@react-keycloak/web'
import { fetchModules, type Module } from '@/services/modulesApi'
import type { ModuleSortValue } from './ToolBarModules'
import { useDebounce } from '@/lib/useDebounce'
import { DIFFICULTY_COLORS } from './module-creation/constants'
import type { GridCols } from '@/components/courses/UniversalFilters'
import CourseCard, { type CardItem } from '@/components/courses/CourseCard'

const API_BASE = import.meta.env.VITE_API_URL as string

const gridClass: Record<GridCols, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

// ── Adapt Module → CardItem ────────────────────────────────────────────────────

function moduleToCardItem(mod: Module, coverImageUrl?: string): CardItem {
    const sectionCount = mod.sections?.length ?? 0
    const diffColor = DIFFICULTY_COLORS[mod.difficulty ?? 'Easy'] ?? DIFFICULTY_COLORS['Easy']

    return {
        id: mod.id,
        title: mod.title || 'Untitled',
        description: mod.description || 'No description',
        category: mod.category,
        duration: mod.estimated_time ? `${mod.estimated_time} min` : undefined,
        unitCount: sectionCount,
        unitLabel: sectionCount === 1 ? 'Section' : 'Sections',
        coverImageUrl,
        difficultyBadge: mod.difficulty ?? undefined,
        difficultyBadgeClass: diffColor,
        statusBadge: mod.status !== 'published' ? mod.status : undefined,
    }
}

// ── Skeleton card ──────────────────────────────────────────────────────────────

function ModuleCardSkeleton() {
    return (
        <div className="flex flex-col bg-surface rounded-2xl overflow-hidden border border-border animate-pulse">
            <div className="h-48 w-full bg-surface-subtle" />
            <div className="p-5 flex flex-col gap-3">
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

    if (loading) {
        return (
            <motion.div animate={{ opacity: 1 }} className="w-full h-full">
                <div className={`grid ${gridClass[cols]} gap-8`}>
                    {Array.from({ length: 6 }, (_, i) => <ModuleCardSkeleton key={`sk-${i}`} />)}
                </div>
            </motion.div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm font-medium text-red-400">{error}</p>
                <button
                    type="button"
                    onClick={() => globalThis.location.reload()}
                    className="text-xs text-[#A78BFA] hover:text-[#7C3AED] transition-colors"
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
            <motion.div layout className={`grid ${gridClass[cols]} gap-8`}>
                <AnimatePresence mode="popLayout">
                    {modules.map(mod => (
                        <motion.div
                            key={mod.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{
                                y: -4,
                                scale: 1.02,
                                boxShadow: '0 12px 28px -6px rgba(147, 51, 234, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
                            }}
                            transition={{
                                layout: { type: 'spring', stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                                scale: { duration: 0.2 },
                                y: { type: 'spring', stiffness: 400, damping: 25 },
                                boxShadow: { duration: 0.25 },
                            }}
                            className="rounded-xl cursor-pointer"
                        >
                            <CourseCard
                                item={moduleToCardItem(mod, mod.cover_image ? coverUrls[mod.cover_image] : undefined)}
                                cols={cols}
                                basePath="/content-manager/modules"
                                paramKey="moduleId"
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </LayoutGroup>
    )
}
