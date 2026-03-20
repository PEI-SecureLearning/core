import { Blocks, Clock, GripVertical, X } from 'lucide-react'
import type { PlaceholderModule } from '../modules/module-creation/placeholderModules'

interface CourseModuleCardProps {
    readonly module: PlaceholderModule
    readonly variant: 'library' | 'stack'
    readonly isDimmed?: boolean
    readonly onRemove?: () => void
    readonly dragHandleProps?: Record<string, unknown>
}

const DIFFICULTY_COLOR: Record<string, string> = {
    Easy: 'bg-green-500/15 text-green-400 border-green-500/30',
    Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    Hard: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export function CourseModuleCard({
    module,
    variant,
    isDimmed = false,
    onRemove,
    dragHandleProps,
}: CourseModuleCardProps) {
    const difficultyColor = DIFFICULTY_COLOR[module.difficulty ?? ''] ?? 'bg-red-100 text-red-700 border-red-300'

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl border bg-surface transition-all ${isDimmed
                ? 'opacity-40 border-border'
                : 'border-border hover:border-primary/40 hover:shadow-md hover:shadow-primary/10'
                }`}
        >
            {variant === 'stack' && (
                <div
                    {...dragHandleProps}
                    className="flex-shrink-0 text-muted-foreground/40 hover:text-accent-secondary cursor-grab active:cursor-grabbing transition-colors"
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            )}

            <img
                src={module.image}
                alt={module.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                    {module.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium text-accent-secondary bg-primary/15 px-1.5 py-0.5 rounded">
                        {module.category}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${difficultyColor}`}>
                        {module.difficulty}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {module.estimatedTime}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Blocks className="w-3 h-3" />
                    {module.unitCount}
                </span>
            </div>

            {variant === 'stack' && onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}
