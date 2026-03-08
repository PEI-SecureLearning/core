import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Blocks, BookOpen, AlertCircle } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useKeycloak } from '@react-keycloak/web'
import { fetchModules, type Module } from '@/services/modulesApi'
import type { ModuleSortValue } from './ToolBarModules'
import { useDebounce } from '@/lib/useDebounce'
import { DIFFICULTY_COLORS } from './module-creation/constants'
import type { GridCols } from '@/components/courses/UniversalFilters'

const gridClass: Record<GridCols, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

const API_BASE = import.meta.env.VITE_API_URL as string

// ── Auth-gated image: fetches via Bearer token → object URL ───────────────────

function AuthImage({ contentId, token, alt, className }: {
    readonly contentId: string
    readonly token?: string
    readonly alt: string
    readonly className?: string
}) {
    const [src, setSrc] = useState<string | null>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        if (!contentId) return
        let revoked = false
        const url = `${API_BASE}/content/${encodeURIComponent(contentId)}/file`
        fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
            .then(r => r.ok ? r.blob() : Promise.reject(new Error('not ok')))
            .then(blob => {
                if (!revoked) setSrc(URL.createObjectURL(blob))
            })
            .catch(() => { if (!revoked) setFailed(true) })
        return () => {
            revoked = true
            setSrc(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
        }
    }, [contentId, token])

    if (failed) return null
    if (!src) return (
        // Skeleton shimmer while loading
        <div className={`${className ?? ''} bg-slate-100 animate-pulse`} />
    )
    return <img src={src} alt={alt} className={className} />
}

// ── Skeleton card shown while loading ─────────────────────────────────────────

function ModuleCardSkeleton() {
    return (
        <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-purple-500/10 animate-pulse">
            <div className="h-48 w-full bg-slate-100" />
            <div className="p-5 flex flex-col gap-3">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between">
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
            </div>
        </div>
    )
}

// ── Single module card ─────────────────────────────────────────────────────────

function ModuleCard({ mod, token }: { readonly mod: Module; readonly token?: string }) {
    const sectionCount = mod.sections?.length ?? 0
    const diffColor = DIFFICULTY_COLORS[mod.difficulty ?? 'Easy'] ?? DIFFICULTY_COLORS['Easy']

    return (
        <Link
            key={mod.id}
            to="/content-manager/modules/$moduleId"
            params={{ moduleId: mod.id }}
            className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-purple-500/20 shadow-sm hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(168,85,247,0.18)] no-underline"
        >
            {/* Cover image / fallback */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-50">
                <div className="absolute inset-0 bg-purple-300/20 z-10 group-hover:bg-transparent transition-colors duration-500" />
                {mod.cover_image ? (
                    <AuthImage
                        contentId={mod.cover_image}
                        token={token}
                        alt={mod.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-purple-200" />
                    </div>
                )}

                {/* Category badge */}
                {mod.category && (
                    <div className="absolute top-3 left-3 z-20">
                        <span className="px-3 py-1 bg-white/85 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-800 border border-purple-500/30">
                            {mod.category}
                        </span>
                    </div>
                )}

                {/* Difficulty badge */}
                {mod.difficulty && (
                    <div className="absolute top-3 right-3 z-20">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${diffColor}`}>
                            {mod.difficulty}
                        </span>
                    </div>
                )}

                {/* Status badge — show for non-published */}
                {mod.status !== 'published' && (
                    <div className="absolute bottom-3 right-3 z-20">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${mod.status === 'draft'
                            ? 'bg-slate-100/90 text-slate-600 border-slate-300'
                            : 'bg-orange-100/90 text-orange-700 border-orange-300'
                            }`}>
                            {mod.status}
                        </span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-purple-900 mb-2 group-hover:text-purple-700 transition-colors line-clamp-1">
                    {mod.title || <span className="text-slate-400 italic">Untitled</span>}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                    {mod.description || <span className="italic">No description</span>}
                </p>
                <div className="mt-auto pt-4 border-t border-purple-500/10 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-purple-400">
                        <Blocks className="w-3 h-3" />
                        <span>
                            {sectionCount} {sectionCount === 1 ? 'Section' : 'Sections'}
                            {mod.estimated_time ? ` · ${mod.estimated_time} min` : ''}
                        </span>
                    </div>
                    <span className="text-xs font-bold text-purple-700 group-hover:text-purple-500 transition-colors">
                        VIEW MODULE →
                    </span>
                </div>
            </div>
        </Link>
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
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Only hit the API after the user pauses typing for 400 ms
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
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm font-medium text-red-500">{error}</p>
                <button
                    type="button"
                    onClick={() => globalThis.location.reload()}
                    className="text-xs text-purple-600 hover:text-purple-800 transition-colors"
                >
                    Try again
                </button>
            </div>
        )
    }

    if (modules.length === 0) {
        const isFiltered = debouncedSearch.trim() !== ''
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                <BookOpen className="w-10 h-10 text-slate-200" />
                {isFiltered ? (
                    <>
                        <p className="text-sm font-medium">No modules match "{debouncedSearch}"</p>
                        <p className="text-xs text-slate-400">Try a different search term.</p>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-medium">No modules yet</p>
                        <p className="text-xs text-slate-400">Create your first module to get started.</p>
                    </>
                )}
            </div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full">
            <div className={`grid ${gridClass[cols]} gap-8`}>
                {modules.map(mod => <ModuleCard key={mod.id} mod={mod} token={keycloak.token} />)}
            </div>
        </motion.div>
    )
}
