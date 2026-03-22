import { useState, useCallback } from 'react'
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useKeycloak } from '@react-keycloak/web'
import { toast } from 'sonner'
import { createCourse, updateCourse, type CourseDifficulty, type Course } from '@/services/coursesApi'
import { type Module } from '@/services/modulesApi'
import { CourseCreatorTopBar } from './CourseCreatorTopBar'
import { AnimatePresence } from 'framer-motion'
import { CourseModuleStack } from './CourseModuleStack'
import { CourseDetailsSidebar } from './sidebar/CourseDetailsSidebar'
import { ModuleLibrarySidebar } from './sidebar/ModuleLibrarySidebar'
import { CoursePreview } from './CoursePreview'

interface CourseCreatorProps {
    readonly onBack: () => void
    readonly onPublished?: () => void
    readonly initialCourse?: Course
    readonly initialModules?: Module[]
    readonly isEditing?: boolean
}

export function CourseCreator({ onBack, onPublished, initialCourse, initialModules, isEditing }: CourseCreatorProps) {
    const { keycloak } = useKeycloak()

    // Group state for easier management
    const [data, setData] = useState({
        title: initialCourse?.title ?? '',
        description: initialCourse?.description ?? '',
        category: initialCourse?.category ?? '',
        difficulty: (initialCourse?.difficulty as CourseDifficulty) ?? 'Easy',
        coverImageId: initialCourse?.cover_image ?? null,
        coverImageUrl: null as string | null,
    })

    const patch = useCallback((p: Partial<typeof data>) => setData(prev => ({ ...prev, ...p })), [])

    const [selectedModules, setSelectedModules] = useState<Module[]>(initialModules ?? [])
    const [isSaving, setIsSaving] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [activeModule, setActiveModule] = useState<Module | null>(null)

    const selectedIds = selectedModules.map((m) => m.id)

    // Calculate expected time dynamically
    const totalMinutes = selectedModules.reduce((acc, mod) => acc + (parseInt(mod.estimated_time || '0', 10) || 0), 0)
    const expectedTime = totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const mod = event.active.data.current?.module as Module | undefined
        if (mod) setActiveModule(mod)
    }, [])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveModule(null)
        const { active, over } = event
        if (!over) return

        const activeId = String(active.id)
        const overId = String(over.id)

        // Drop from library into stack
        if (activeId.startsWith('library-')) {
            const mod = active.data.current?.module as Module | undefined
            if (mod && (overId === 'course-stack' || overId.startsWith('stack-'))) {
                setSelectedModules((prev) => prev.some(m => m.id === mod.id) ? prev : [...prev, mod])
            }
            return
        }

        // Reorder inside stack
        if (activeId.startsWith('stack-') && overId.startsWith('stack-')) {
            const oldIdx = Number.parseInt(activeId.replace('stack-', ''), 10)
            const newIdx = Number.parseInt(overId.replace('stack-', ''), 10)
            if (oldIdx !== newIdx) {
                setSelectedModules((prev) => arrayMove(prev, oldIdx, newIdx))
            }
        }
    }, [])

    const handleRemove = useCallback((index: number) => {
        setSelectedModules((prev) => prev.filter((_, i) => i !== index))
    }, [])

    const handlePublish = async () => {
        if (!data.title.trim()) { toast.error('Title is required.'); return }
        if (!data.description.trim()) { toast.error('Description is required.'); return }
        if (!data.category.trim()) { toast.error('Category is required.'); return }
        if (selectedModules.length === 0) { toast.error('Add at least one module.'); return }

        setIsSaving(true)
        try {
            const payload = {
                title: data.title.trim(),
                description: data.description.trim(),
                category: data.category.trim(),
                difficulty: data.difficulty,
                expected_time: expectedTime,
                cover_image: data.coverImageId,
                modules: selectedModules.map((m) => m.id),
            }
            if (isEditing && initialCourse) {
                await updateCourse(initialCourse.id, payload, keycloak.token)
                toast.success('Course updated!')
            } else {
                await createCourse(payload, keycloak.token)
                toast.success('Course published!')
            }
            onPublished?.()
            onBack()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save course.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 w-full h-full flex flex-col bg-background">
            <CourseCreatorTopBar
                title={data.title}
                onBack={onBack}
                onPreview={() => setShowPreview(true)}
                canPreview={selectedModules.length > 0}
                onPublish={() => { void handlePublish() }}
                isSaving={isSaving}
            />

            <DndContext collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex-1 flex overflow-hidden">
                    {/* Left – metadata sidebar */}
                    <CourseDetailsSidebar
                        data={{ ...data, expectedTime }}
                        onChange={patch}
                        getToken={() => keycloak.token}
                    />

                    {/* Centre – course stack */}
                    <div className="flex-1 overflow-hidden bg-surface-subtle">
                        <CourseModuleStack modules={selectedModules} onRemove={handleRemove} />
                    </div>

                    {/* Right – module library */}
                    <ModuleLibrarySidebar selectedIds={selectedIds} />
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeModule && (
                        <div className="w-64 opacity-90 rotate-2 scale-105 p-3 rounded-xl border border-[#7C3AED]/40 bg-surface shadow-xl">
                            <p className="text-sm font-semibold text-foreground truncate">{activeModule.title}</p>
                            <p className="text-xs text-muted-foreground">{activeModule.category}</p>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            <AnimatePresence>
                {showPreview && (
                    <CoursePreview
                        data={{ ...data, expectedTime }}
                        selectedModules={selectedModules}
                        onClose={() => setShowPreview(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
