import { useState, useCallback } from 'react'
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { AnimatePresence } from 'framer-motion'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { PlaceholderModule } from '../module-creation/placeholderModules'
import { CourseCreatorTopBar } from './CourseCreatorTopBar'
import { AvailableModuleList } from './AvailableModuleList'
import { CourseModuleStack } from './CourseModuleStack'
import { CourseModuleCard } from './CourseModuleCard'
import { CoursePreview } from './CoursePreview'

interface CourseCreatorProps {
    readonly onBack: () => void
}

export function CourseCreator({ onBack }: CourseCreatorProps) {
    const [courseTitle, setCourseTitle] = useState('')
    const [selectedModules, setSelectedModules] = useState<PlaceholderModule[]>([])
    const [showPreview, setShowPreview] = useState(false)
    const [activeModule, setActiveModule] = useState<PlaceholderModule | null>(null)

    const selectedIds = selectedModules.map((m) => m.id)

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event
        const mod = active.data.current?.module as PlaceholderModule | undefined
        if (mod) {
            setActiveModule(mod)
        }
    }, [])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveModule(null)
        const { active, over } = event

        if (!over) return

        const activeId = String(active.id)
        const overId = String(over.id)

        // Dragging from library to stack
        if (activeId.startsWith('library-')) {
            const mod = active.data.current?.module as PlaceholderModule | undefined
            if (mod && (overId === 'course-stack' || overId.startsWith('stack-'))) {
                setSelectedModules((prev) => [...prev, mod])
            }
            return
        }

        // Reordering within the stack
        if (activeId.startsWith('stack-') && overId.startsWith('stack-')) {
            const oldIndex = Number.parseInt(activeId.replaceAll('stack-', ''), 10)
            const newIndex = Number.parseInt(overId.replaceAll('stack-', ''), 10)
            if (oldIndex !== newIndex) {
                setSelectedModules((prev) => arrayMove(prev, oldIndex, newIndex))
            }
        }
    }, [])

    const handleRemove = useCallback((index: number) => {
        setSelectedModules((prev) => prev.filter((_, i) => i !== index))
    }, [])

    return (
        <div className="w-full h-full flex flex-col bg-slate-50">
            <CourseCreatorTopBar
                title={courseTitle}
                onTitleChange={setCourseTitle}
                onBack={onBack}
                onPreview={() => setShowPreview(true)}
                canPreview={selectedModules.length > 0}
            />

            <DndContext
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 flex overflow-hidden">
                    {/* Left panel – module library */}
                    {/* Right panel – course stack */}
                    <div className="flex-1 overflow-hidden">
                        <CourseModuleStack
                            modules={selectedModules}
                            onRemove={handleRemove}
                        />
                    </div>
                    <div className="w-[30%] flex-shrink-0 bg-white border-r border-slate-200 overflow-hidden">
                        <AvailableModuleList selectedIds={selectedIds} />
                    </div>

                </div>

                <DragOverlay dropAnimation={null}>
                    {activeModule && (
                        <div className="w-[360px] opacity-90 rotate-2 scale-105">
                            <CourseModuleCard module={activeModule} variant="library" />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            <AnimatePresence>
                {showPreview && (
                    <CoursePreview
                        title={courseTitle}
                        modules={selectedModules}
                        onClose={() => setShowPreview(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
