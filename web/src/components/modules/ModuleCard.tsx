import { Edit2, Eye, Trash2, Clock, BarChart, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModuleCardProps {
    readonly title: string
    readonly category: string
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
                    ? "hover:text-red-500 hover:bg-red-50 hover:border-red-200"
                    : "hover:text-primary hover:bg-primary/5 hover:border-primary/20"
            )}
            title={title}
        >
            <Icon size={14} />
        </button>
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
}: ModuleCardProps) {
    const isList = layout === 'list'

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex bg-background border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300",
                isList ? "flex-row h-44" : "flex-col",
                onClick && "cursor-pointer",
                className
            )}
        >
            {/* Banner Section */}
            <div className={cn(
                "relative overflow-hidden bg-muted flex items-center justify-center",
                isList ? "w-48 h-full flex-shrink-0" : "aspect-video w-full"
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
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 p-5 gap-2 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className={cn(
                        "font-semibold text-foreground group-hover:text-primary transition-colors leading-snug",
                        isList ? "text-base" : "text-sm line-clamp-2"
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
                <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
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

                    {/* Actions (Bottom Right) */}
                    {showActions && (onEdit || onPreview || onDelete) && (
                        <div className="flex items-center gap-1.5 h-8">
                            {onPreview && <ActionButton onClick={onPreview} icon={Eye} title="Preview" />}
                            {onEdit && <ActionButton onClick={onEdit} icon={Edit2} title="Edit" />}
                            {onDelete && <ActionButton onClick={onDelete} icon={Trash2} title="Delete" variant="danger" />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
