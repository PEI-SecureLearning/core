import { useDraggable } from '@dnd-kit/core'
import { Search } from 'lucide-react'
import { useState } from 'react'
import type { PlaceholderModule } from '../../modules/module-creation/placeholderModules'
import { PLACEHOLDER_MODULES } from '../../modules/module-creation/placeholderModules'
import { CourseModuleCard } from './CourseModuleCard'

interface AvailableModuleListProps {
    readonly selectedIds: string[]
}

function DraggableModule({ module, isDimmed }: { readonly module: PlaceholderModule; readonly isDimmed: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `library-${module.id}`,
        data: { module },
    })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
        >
            <CourseModuleCard module={module} variant="library" isDimmed={isDimmed} />
        </div>
    )
}

export function AvailableModuleList({ selectedIds }: AvailableModuleListProps) {
    const [search, setSearch] = useState('')

    const filtered = PLACEHOLDER_MODULES.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Module Library
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search modules..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]/40"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
                {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">
                        No modules found
                    </p>
                ) : (
                    filtered.map((mod) => (
                        <DraggableModule
                            key={mod.id}
                            module={mod}
                            isDimmed={selectedIds.includes(mod.id)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
