import { Blocks, Clock, GripVertical, X } from 'lucide-react'
import type { PlaceholderModule } from '../../modules/module-creation/placeholderModules'

interface CourseModuleCardProps {
    readonly module: PlaceholderModule
    readonly variant: 'library' | 'stack'
    readonly isDimmed?: boolean
    readonly onRemove?: () => void
    readonly dragHandleProps?: Record<string, unknown>
}

const DIFFICULTY_COLOR: Record<string, string> = {
    Easy:   'bg-green-100 text-green-700 border-green-300',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Hard:   'bg-red-100 text-red-700 border-red-300',
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
            className={`flex items-center gap-3 p-3 rounded-xl border bg-white transition-all ${isDimmed
                    ? 'opacity-40 border-slate-100'
                    : 'border-slate-200 hover:border-purple-300 hover:shadow-md hover:shadow-purple-100/50'
                }`}
        >
            {variant === 'stack' && (
                <div
                    {...dragHandleProps}
                    className="flex-shrink-0 text-slate-300 hover:text-purple-500 cursor-grab active:cursor-grabbing transition-colors"
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
                <p className="text-sm font-semibold text-slate-800 truncate">
                    {module.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                        {module.category}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${difficultyColor}`}>
                        {module.difficulty}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    {module.estimatedTime}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Blocks className="w-3 h-3" />
                    {module.unitCount}
                </span>
            </div>

            {variant === 'stack' && onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}
