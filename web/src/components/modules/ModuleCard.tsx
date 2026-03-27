import { Edit2, Eye, Trash2, Clock, BarChart, BookOpen, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModuleCardProps {
    readonly title: string
    readonly category?: string
    readonly description: string
    readonly coverImage?: string
    readonly estimatedTime?: string
    readonly difficulty?: string
    readonly onEdit?: () => void
    readonly onPreview?: () => void
    readonly onDelete?: () => void
    readonly onClick?: () => void
    readonly showActions?: boolean
    readonly layout?: 'grid' | 'list'
    readonly className?: string
    // Added props for course/learning listings
    readonly progress?: number
    readonly showProgress?: boolean
    readonly isCompleted?: boolean
    readonly isOverdue?: boolean
    readonly statusBadge?: string
    readonly statusBadgeClass?: string
    readonly isSelected?: boolean
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ActionButton({
    onClick,
    icon: Icon,
    title,
    variant = 'default'
}: {
    onClick: () => void,
    icon: any,
    title: string,
    variant?: 'default' | 'danger'
}) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClick();
            }}
            className={cn(
                "p-1.5 rounded-lg border border-border/50 text-muted-foreground transition-all shadow-sm bg-background",
                variant === 'danger'
                    ? "hover:text-error hover:bg-error/10 hover:border-error/20"
                    : "hover:text-primary hover:bg-primary/5 hover:border-primary/20"
            )}
            title={title}
        >
            <Icon size={14} />
        </button>
    )
}

function ProgressBar({ progress, color = 'bg-primary/90' }: { progress: number; color?: string }) {
    if (progress === 0) return null
    return (
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden mt-2">
            <div
                className={`h-full rounded-full ${color} transition-all duration-500`}
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ModuleCard({
    title,
    category,
    description,
    coverImage,
    estimatedTime,
    difficulty,
    onEdit,
    onPreview,
    onDelete,
    onClick,
    showActions = true,
    layout = 'grid',
    className,
    progress = 0,
    showProgress = false,
    isCompleted = false,
    isOverdue = false,
    statusBadge,
    statusBadgeClass,
    isSelected = false,
}: ModuleCardProps) {
    const isList = layout === 'list'

    return (
        <div
            onClick={onClick}
            className={cn(
                "max-h-[300px] h-full group relative flex overflow-hidden transition-all duration-300",
                "rounded-xl",
                isList ? "flex-row h-44 cursor-pointer" : "flex-col cursor-pointer",
                isCompleted ? "grayscale opacity-75" : "",
                isOverdue ? "border-2 border-red-500/50 bg-red-500/5 shadow-[0_0_12px_-4px_rgba(239,68,68,0.4)]" :
                (isSelected ? "border-2 border-primary bg-primary/5 shadow-md" : "border-2 border-transparent border-t-border border-r-border border-b-border border-l-border bg-background shadow-sm hover:shadow-lg hover:border-primary/50"),
                className
            )}
        >
            {/* Banner Section */}
            <div className={cn(
                "relative overflow-hidden bg-muted flex items-center justify-center",
                isList ? "w-48 h-full flex-shrink-0" : "h-36 w-full flex-shrink-0"
            )}>
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                        <BookOpen className="w-10 h-10 text-primary/30" />
                    </div>
                )}

                {/* Category Badge (Top Left) */}
                {category && (
                    <div className="absolute top-2 left-3 z-10">
                        <span className="px-2.5 py-0.5 bg-background/85 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-primary/80 border border-primary/30">
                            {category}
                        </span>
                    </div>
                )}

                {/* Status Badge (Bottom Right) */}
                {statusBadge && (
                    <div className="absolute bottom-2 right-3 z-10">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-sm", statusBadgeClass ?? "bg-muted/90 text-muted-foreground border-border/60")}>
                            {statusBadge}
                        </span>
                    </div>
                )}
                
                {/* Completed Checkmark Overlay */}
                {isCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-30 bg-black/10">
                        <Check className="w-24 h-24 text-foreground/50" strokeWidth={3} />
                    </div>
                )}

                {/* Selected Indicator */}
                {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-200 z-20">
                        <Check className="w-4 h-4" strokeWidth={3} />
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 p-5 gap-2 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className={cn(
                        "font-semibold text-foreground transition-colors leading-snug",
                        isList ? "text-base" : "text-sm line-clamp-2",
                        isOverdue ? "group-hover:text-red-500" : "group-hover:text-primary"
                    )}>
                        {title}
                    </h3>
                </div>

                <p className={cn(
                    "text-muted-foreground leading-relaxed flex-1",
                    isList ? "text-sm line-clamp-2" : "text-xs line-clamp-3"
                )}>
                    {description}
                </p>

                {/* Footer: Metadata & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto min-h-[32px]">
                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 text-muted-foreground/70">
                        {estimatedTime && (
                            <div className="flex items-center gap-1 text-[11px]">
                                <Clock size={12} />
                                {estimatedTime}
                            </div>
                        )}
                        {difficulty && (
                            <div className="flex items-center gap-1 text-[11px]">
                                <BarChart size={12} />
                                {difficulty}
                            </div>
                        )}
                    </div>
                    
                    {/* Progress Text */}
                    {showProgress && progress > 0 && !isCompleted && (
                        <div className="ml-auto mr-2">
                            <span className={cn("text-xs font-semibold", isOverdue ? "text-red-500" : "text-primary")}>{progress}%</span>
                        </div>
                    )}
                    {isCompleted && (
                        <div className="ml-auto mr-2">
                           <span className="text-xs font-semibold text-success flex items-center gap-1"><Check size={12}/> Done</span>
                        </div>
                    )}

                    {/* Actions (Bottom Right) */}
                    {showActions && (onEdit || onPreview || onDelete) && (
                        <div className="flex items-center gap-1.5 h-8">
                            {onPreview && <ActionButton onClick={onPreview} icon={Eye} title="Preview" />}
                            {onEdit && <ActionButton onClick={onEdit} icon={Edit2} title="Edit" />}
                            {onDelete && <ActionButton onClick={onDelete} icon={Trash2} title="Delete" variant="danger" />}
                        </div>
                    )}
                </div>
                {showProgress && <ProgressBar progress={progress} color={isOverdue ? 'bg-red-500' : undefined} />}
            </div>
        </div>
    )
}

