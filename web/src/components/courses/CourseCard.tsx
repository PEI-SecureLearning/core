import { Link } from '@tanstack/react-router'
import { BookOpen, Trash2, Check } from 'lucide-react'
import type { GridCols } from './UniversalFilters'

// ─── Generic card data shape ──────────────────────────────────────────────────
// Both Course and Module (from modulesApi) can be adapted into this shape.

export type CardItem = {
    id: string
    title: string
    description: string
    /** Emoji or short text shown as a visual banner fill; can be undefined. */
    icon?: string
    /** Tailwind gradient class string, e.g. 'from-violet-600 to-purple-800' */
    color?: string
    category?: string
    duration?: string
    /** Number shown as primary "unit count" stat (e.g. modules, sections). */
    unitCount?: number
    /** Label for `unitCount`, e.g. "modules" or "sections". */
    unitLabel?: string
    userCount?: number
    /** 0–100 completion percentage; omit or 0 to hide. */
    progress?: number
    /** Optional cover image URL (shown instead of icon/color banner). */
    coverImageUrl?: string
    /** Whether the course is completed (certified). */
    isCompleted?: boolean
    /** Whether the course is overdue. */
    isOverdue?: boolean
    /** Whether the course/content has expired. */
    isExpired?: boolean
    /** Status badge text (e.g. 'draft', 'archived'). Only shown when provided. */
    statusBadge?: string
    /** CSS classes for the status badge color states. */
    statusBadgeClass?: string
    /** Extra badge text shown top-left (e.g. difficulty). */
    difficultyBadge?: string
    /** CSS classes for the difficulty badge, e.g. colour tokens. */
    difficultyBadgeClass?: string
    /**
     * Whether to render the progress bar and progress badge.
     * Should be true only for learner/user roles, false for admin/manager/content roles.
     * Defaults to true when omitted.
     */
    showProgress?: boolean
    /** Callback for delete action; if provided, shows a trash icon. */
    onDelete?: (id: string) => void
    /** Whether the card is in selection mode */
    selectable?: boolean
    /** Whether the card is currently selected */
    isSelected?: boolean
    /** Callback for selection/click when selectable is true */
    onClick?: () => void
}

type CourseCardProps = {
    item: CardItem
    cols: GridCols
    /** Base path used to build the link, e.g. '/courses' or '/content-manager/modules' */
    basePath?: string
    /** Route param key injected into the link, default 'courseId' */
    paramKey?: string
    /** Callback for delete action; if provided, shows a trash icon. */
    onDelete?: (id: string) => void
    /** Whether the card is in selection mode */
    selectable?: boolean
    /** Whether the card is currently selected */
    isSelected?: boolean
    /** Callback for selection/click when selectable is true */
    onClick?: () => void
}

// ─── shared progress badge helpers ───────────────────────────────────────────

function ProgressBadge({ progress }: { progress: number }) {
    if (progress === 100)
        return <span className="text-xs text-success font-semibold">✓ Completed</span>
    if (progress > 0)
        return <span className="text-xs text-white/80 font-medium">{progress}%</span>
    return null
}

function ProgressBar({ progress, color = 'bg-primary/90' }: { progress: number; color?: string }) {
    if (progress === 0) return null
    return (
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
                className={`h-full rounded-full ${color} transition-all duration-500`}
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}

function DeleteButton({ id, onDelete }: { id: string; onDelete?: (id: string) => void }) {
    if (!onDelete) return null
    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onDelete(id)
            }}
            className="p-1.5 rounded-lg bg-surface/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-error hover:bg-error/10 hover:border-error/20 transition-all shadow-sm"
            title="Delete Module"
        >
            <Trash2 size={14} />
        </button>
    )
}

// ─── Banner: colour gradient with icon OR cover image ────────────────────────

function Banner({
    item,
    height,
    iconSize,
}: {
    item: CardItem
    height: string
    iconSize: string
}) {
    const showProg = item.showProgress !== false

    if (item.coverImageUrl) {
        return (
            <div className={`relative ${height} overflow-hidden bg-muted`}>
                <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {item.category && (
                    <div className="absolute top-2 left-3 z-10">
                        <span className="px-2.5 py-0.5 bg-background/85 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-primary/80 border border-primary/30">
                            {item.category}
                        </span>
                    </div>
                )}
                {item.difficultyBadge && (
                    <div className="absolute top-2 right-3 z-10">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${item.difficultyBadgeClass ?? 'bg-muted/90 text-muted-foreground border-border/60'}`}>
                            {item.difficultyBadge}
                        </span>
                    </div>
                )}
                {item.statusBadge && (
                    <div className="absolute bottom-2 right-3 z-10">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${item.statusBadgeClass ?? 'bg-muted/90 text-muted-foreground border-border/60'}`}>
                            {item.statusBadge}
                        </span>
                    </div>
                )}
                {item.onDelete && (
                    <div className="absolute bottom-2 left-3 z-10">
                        <DeleteButton id={item.id} onDelete={item.onDelete} />
                    </div>
                )}
                {showProg && (item.progress ?? 0) > 0 && (
                    <div className="absolute bottom-2 right-3 z-10">
                        <ProgressBadge progress={item.progress ?? 0} />
                    </div>
                )}
                {item.isCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-30">
                        <Check className="w-24 h-24 text-white" strokeWidth={3} />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={`relative ${height} bg-primary flex items-center justify-center`}>
            {item.icon
                ? <span className={`${iconSize} select-none`}>{item.icon}</span>
                : <BookOpen className="w-10 h-10 text-primary-foreground/30" />
            }
            {showProg && (item.progress ?? 0) > 0 && (
                <div className="absolute bottom-2 right-3">
                    <ProgressBadge progress={item.progress ?? 0} />
                </div>
            )}
            {item.difficultyBadge && (
                <div className="absolute top-2 right-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${item.difficultyBadgeClass ?? 'bg-primary/20 text-primary-foreground border-primary-foreground/30'}`}>
                        {item.difficultyBadge}
                    </span>
                </div>
            )}
            {item.isCompleted && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-30">
                    <Check className="w-24 h-24 text-white" strokeWidth={3} />
                </div>
            )}
        </div>
    )
}

// ─── 1-col: wide horizontal card ─────────────────────────────────────────────

function CardHorizontal({ item, to, params, selectable, isSelected, onClick }: { item: CardItem; to: string; params: Record<string, string>; selectable?: boolean; isSelected?: boolean; onClick?: () => void }) {
    const showProg = item.showProgress !== false

    if (selectable) {
        return (
            <div onClick={onClick} className={`h-full ${item.isCompleted ? 'grayscale opacity-75' : ''}`}>
                <div className={`group flex flex-row rounded-xl border-2 transition-all duration-200 overflow-hidden cursor-pointer h-full ${item.isOverdue ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_12px_-4px_rgba(239,68,68,0.4)]' : (isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border/60 bg-background hover:border-primary/50 shadow-sm')}`}>
                    {/* Left colour strip / cover */}
                    {item.coverImageUrl ? (
                        <div className="relative flex-shrink-0 w-40 overflow-hidden">
                            <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                        </div>
                    ) : (
                        <div className={`relative flex-shrink-0 w-40 bg-gradient-to-br ${item.color ?? 'from-purple-600 to-purple-800'} flex flex-col items-center justify-center gap-2`}>
                            {item.icon
                                ? <span className="text-5xl select-none">{item.icon}</span>
                                : <BookOpen className="w-10 h-10 text-white/50" />
                            }
                        </div>
                    )}

                    {/* Right content */}
                    <div className="flex flex-col flex-1 p-5 gap-2 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap text-left">
                                {item.category && (
                                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                                        {item.category}
                                    </span>
                                )}
                                {item.difficultyBadge && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.difficultyBadgeClass ?? 'bg-muted text-muted-foreground border-border/60'}`}>
                                        {item.difficultyBadge}
                                    </span>
                                )}
                            </div>
                            {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shadow-sm animate-in zoom-in duration-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            )}
                        </div>

                        <h3 className={`text-base font-semibold text-foreground transition-colors leading-snug text-left ${item.isOverdue ? 'group-hover:text-red-500' : 'group-hover:text-primary'}`}>
                            {item.title}
                        </h3>

                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1 text-left">
                            {item.description}
                        </p>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <Link
            to={to as any}
            params={params as any}
            className={`group flex flex-row rounded-r-xl border border-border bg-background shadow-sm transition-all duration-200 overflow-hidden cursor-pointer ${item.isCompleted ? 'grayscale opacity-75' : ''}`}
        >
            {/* Left colour strip / cover */}
            {item.coverImageUrl ? (
                <div className="relative flex-shrink-0 w-40 overflow-hidden">
                    <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                </div>
            ) : (
                <div className={`relative flex-shrink-0 w-40 bg-primary flex flex-col items-center justify-center gap-2`}>
                    {item.icon
                        ? <span className="text-5xl select-none">{item.icon}</span>
                        : <BookOpen className="w-10 h-10 text-primary-foreground/50" />
                    }
                    {showProg && (item.progress ?? 0) > 0 && (
                        <div className="absolute bottom-2 right-2">
                            <ProgressBadge progress={item.progress ?? 0} />
                        </div>
                    )}
                    {item.onDelete && (
                        <div className="absolute bottom-2 left-2">
                            <DeleteButton id={item.id} onDelete={item.onDelete} />
                        </div>
                    )}
                </div>
            )}

            {/* Right content */}
            <div className="flex flex-col flex-1 p-5 gap-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {item.category && (
                        <span className="text-xs font-medium text-primary uppercase tracking-wide">
                            {item.category}
                        </span>
                    )}
                    {item.difficultyBadge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.difficultyBadgeClass ?? 'bg-muted text-muted-foreground border-border/60'}`}>
                            {item.difficultyBadge}
                        </span>
                    )}
                </div>

                <h3 className={`text-base font-semibold text-foreground transition-colors leading-snug ${item.isOverdue ? 'group-hover:text-red-500' : 'group-hover:text-primary'}`}>
                    {item.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                    {item.description}
                </p>

                <div className="flex items-center justify-end text-xs text-muted-foreground/70 h-8 mt-auto">
                    {item.onDelete && (
                        <DeleteButton id={item.id} onDelete={item.onDelete} />
                    )}
                    {showProg && (item.progress ?? 0) > 0 && (
                        <span className="ml-auto text-primary font-semibold">{item.progress}%</span>
                    )}
                </div>

                {showProg && <ProgressBar progress={item.progress ?? 0} color={item.isOverdue ? 'bg-red-500' : undefined} />}
            </div>
        </Link>
    )
}

// ─── 2-col: standard vertical card ───────────────────────────────────────────

function CardVertical({ item, to, params, selectable, isSelected, onClick }: { item: CardItem; to: string; params: Record<string, string>; selectable?: boolean; isSelected?: boolean; onClick?: () => void }) {
    const showProg = item.showProgress !== false

    if (selectable) {
        return (
            <div
                onClick={onClick}
                className={`group flex flex-col h-full rounded-xl border-2 transition-all duration-200 overflow-hidden cursor-pointer ${item.isCompleted ? 'grayscale opacity-75' : ''} ${item.isOverdue ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_12px_-4px_rgba(239,68,68,0.4)]' : (isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border/60 bg-background hover:border-primary/50 shadow-sm')}`}
            >
                <div className="relative">
                    <Banner item={item} height="h-36" iconSize="text-5xl" />
                    {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-200 z-20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    )}
                </div>

                <div className="flex flex-col flex-1 p-4 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        {item.category && (
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">
                                {item.category}
                            </span>
                        )}
                    </div>
                    <h3 className={`text-sm font-semibold text-foreground transition-colors leading-snug ${item.isOverdue ? 'group-hover:text-red-500' : 'group-hover:text-primary'}`}>
                        {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                        {item.description}
                    </p>
                </div>
            </div>
        )
    }
    return (
        <Link
            to={to as any}
            params={params as any}
            className={`group flex flex-col rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${item.isCompleted ? 'grayscale opacity-75' : ''} ${item.isOverdue ? 'border-red-500 bg-red-500/5 shadow-[0_0_12px_-4px_rgba(239,68,68,0.4)]' : 'border-border bg-background shadow-sm'}`}
        >
            <Banner item={item} height="h-36" iconSize="text-5xl" />

            <div className="flex flex-col flex-1 p-4 gap-2">
                {item.category && (
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                        {item.category}
                    </span>
                )}
                <h3 className={`text-sm font-semibold text-foreground transition-colors leading-snug ${item.isOverdue ? 'group-hover:text-red-500' : 'group-hover:text-primary'}`}>
                    {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                    {item.description}
                </p>
                <div className="flex items-center justify-end pt-2 border-t border-border/40 mt-1 h-9">
                    {item.onDelete && (
                        <DeleteButton id={item.id} onDelete={item.onDelete} />
                    )}
                </div>
                {showProg && <ProgressBar progress={item.progress ?? 0} color={item.isOverdue ? 'bg-red-500' : undefined} />}
            </div>
        </Link>
    )
}

// ─── 3-col: compact card ──────────────────────────────────────────────────────

function CardCompact({ item, to, params, selectable, isSelected, onClick }: { item: CardItem; to: string; params: Record<string, string>; selectable?: boolean; isSelected?: boolean; onClick?: () => void }) {
    const showProg = item.showProgress !== false

    if (selectable) {
        return (
            <div
                onClick={onClick}
                className={`group flex flex-col h-full rounded-xl border-2 transition-all duration-200 overflow-hidden cursor-pointer ${item.isCompleted ? 'grayscale opacity-75' : ''} ${item.isOverdue ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_12px_-4px_rgba(239,68,68,0.4)]' : (isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border/60 bg-background hover:border-primary/50 shadow-sm')}`}
            >
                <div className="relative">
                    <Banner item={item} height="h-24" iconSize="text-4xl" />
                    {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-200 z-20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    )}
                </div>

                <div className="flex flex-col flex-1 p-3 gap-1.5">
                    {item.category && (
                        <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
                            {item.category}
                        </span>
                    )}
                    <h3 className={`text-xs font-semibold text-foreground transition-colors leading-snug line-clamp-2 ${item.isOverdue ? 'group-hover:text-red-500' : 'group-hover:text-primary'}`}>
                        {item.title}
                    </h3>
                </div>
            </div>
        )
    }
    return (
        <Link
            to={to as any}
            params={params as any}
            className={`group flex flex-col rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${item.isCompleted ? 'grayscale opacity-75' : ''} ${item.isOverdue ? 'border-red-500 bg-red-500/5 shadow-[0_0_12px_-4px_rgba(239,68,68,0.4)]' : 'border-border bg-background shadow-sm'}`}
        >
            <Banner item={item} height="h-24" iconSize="text-4xl" />

            <div className="flex flex-col flex-1 p-3 gap-1.5">
                {item.category && (
                    <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
                        {item.category}
                    </span>
                )}
                <h3 className={`text-xs font-semibold text-foreground transition-colors leading-snug line-clamp-2 ${item.isOverdue ? 'group-hover:text-red-500' : 'group-hover:text-primary'}`}>
                    {item.title}
                </h3>
                <div className="flex items-center justify-end mt-auto pt-2 border-t border-border/40 h-8">
                    {showProg && (item.progress ?? 0) > 0 && (
                        <span className="mr-auto text-[10px] font-semibold text-primary">{item.progress}%</span>
                    )}
                    {item.onDelete && <DeleteButton id={item.id} onDelete={item.onDelete} />}
                </div>
                {showProg && <ProgressBar progress={item.progress ?? 0} color={item.isOverdue ? 'bg-red-500' : undefined} />}
            </div>
        </Link>
    )
}

// ─── main export ──────────────────────────────────────────────────────────────

export default function CourseCard({ item, cols, basePath = '/courses', paramKey = 'courseId', onDelete, selectable, isSelected, onClick }: CourseCardProps) {
    const to = `${basePath}/$${paramKey}`
    const params = { [paramKey]: item.id }

    // Prefer prop, fallback to item.onDelete
    const effectiveItem = { ...item, onDelete: onDelete ?? item.onDelete }

    if (cols === 1) return <CardHorizontal item={effectiveItem} to={to} params={params} selectable={selectable} isSelected={isSelected} onClick={onClick} />
    if (cols === 3) return <CardCompact item={effectiveItem} to={to} params={params} selectable={selectable} isSelected={isSelected} onClick={onClick} />
    return <CardVertical item={effectiveItem} to={to} params={params} selectable={selectable} isSelected={isSelected} onClick={onClick} />
}
