import { GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function SortableBlock({ id, children }: { readonly id: string; readonly children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.4 : 1,
                position: 'relative',
                zIndex: isDragging ? 10 : undefined,
            }}
            className="flex gap-2"
        >
            <button
                ref={setActivatorNodeRef}
                type="button"
                className={`cursor-grab active:cursor-grabbing flex-shrink-0 touch-none mt-2.5 transition-colors ${
                    isDragging ? 'text-muted-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
                }`}
                aria-label="Drag to reorder block"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    )
}
