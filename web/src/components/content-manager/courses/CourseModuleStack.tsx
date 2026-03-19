import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Layers } from 'lucide-react'
import type { PlaceholderModule } from '../modules/module-creation/placeholderModules'
import { CourseModuleCard } from './CourseModuleCard'

interface CourseModuleStackProps {
    readonly modules: PlaceholderModule[]
    readonly onRemove: (index: number) => void
}

function SortableModuleCard({
    module,
    index,
    onRemove,
}: {
    readonly module: PlaceholderModule
    readonly index: number
    readonly onRemove: () => void
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

    return (
        <div ref={setNodeRef} style={style}>
            <CourseModuleCard
                module={module}
                variant="stack"
                onRemove={onRemove}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    )
}

export function CourseModuleStack({ modules, onRemove }: CourseModuleStackProps) {
    const { setNodeRef, isOver } = useDroppable({ id: 'course-stack' })

    const sortableIds = modules.map((_, i) => `stack-${i}`)

    const moduleSuffix = modules.length === 1 ? '' : 's'
    const moduleCountLabel = modules.length === 0
        ? 'Drag modules here to build your course'
        : `${modules.length} module${moduleSuffix} added`

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
                <h2 className="text-sm font-bold uppercase tracking-widest text-foreground mb-1">
                    Course Modules
                </h2>
                <p className="text-[11px] text-muted-foreground">
                    {moduleCountLabel}
                </p>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto px-4 pb-4 transition-colors duration-200 ${isOver ? 'bg-primary/5' : ''
                    }`}
            >
                {modules.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-full gap-3 border-2 border-dashed rounded-xl transition-colors duration-200 ${isOver
                        ? 'border-primary/60 bg-primary/5'
                        : 'border-border'
                        }`}>
                        <Layers className="w-10 h-10 text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground font-medium">
                            Drop modules here
                        </p>
                        <p className="text-xs text-muted-foreground/50">
                            Drag from the library on the left
                        </p>
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
                                />
                            ))}
                        </div>
                    </SortableContext>
                )}
            </div>
        </div>
    )
}
