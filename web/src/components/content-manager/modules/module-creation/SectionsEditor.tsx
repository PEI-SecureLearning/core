import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent,
    pointerWithin,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import type { Block, ModuleFormData, Section } from './types'
import { emptySection } from './constants'
import { BlockDragPreview } from './blocks'
import { SectionCard, SectionDragPreview, ViewTabToggle } from './sections'
import { SectionSettingsSidebar } from './sidebar/SectionSettingsSidebar'

export { SectionCard } from './sections/SectionCard'

export function SectionsEditor({ data, onChange, publishAttempted, getToken }: {
    readonly data: ModuleFormData
    readonly onChange: (patch: Partial<ModuleFormData>) => void
    readonly publishAttempted?: boolean
    readonly getToken?: () => string | undefined
}) {
    const [view, setView] = useState<'module' | 'refresh'>('module')
    const [newestId, setNewestId] = useState<string | null>(null)
    const [newestRefreshId, setNewestRefreshId] = useState<string | null>(null)
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)

    // Tracks whether the active block drag is in the refresh list or the main list.
    const activeBlockIsRefreshRef = useRef(false)
    // Snapshot taken at drag-start; used as rollback if drop is cancelled.
    const dragStartSectionsRef = useRef<Section[]>([])
    const dragStartRefreshRef = useRef<Section[]>([])
    // Live working copy mutated during onDragOver for the correct list.
    const liveBlockSectionsRef = useRef<Section[]>(data.sections)
    // Which section the dragged block currently resides in (updated on cross-section moves).
    const activeBlockSectionIdRef = useRef<string | null>(null)

    const addSection = () => {
        const s = emptySection()
        setNewestId(s.id)
        setSelectedSectionId(s.id)
        onChange({ sections: [...data.sections, s] })
    }

    const addRefreshSection = () => {
        const s = emptySection()
        setNewestRefreshId(s.id)
        setSelectedSectionId(s.id)
        setView('refresh')
        onChange({ hasRefreshModule: true, refreshSections: [...(data.refreshSections ?? []), s] })
    }

    const updateSection = (id: string, patch: Partial<Section>) =>
        onChange({ sections: data.sections.map(s => s.id === id ? { ...s, ...patch } : s) })

    const updateRefreshSection = (id: string, patch: Partial<Section>) =>
        onChange({ refreshSections: (data.refreshSections ?? []).map(s => s.id === id ? { ...s, ...patch } : s) })

    const removeSection = (id: string) =>
        onChange({ sections: data.sections.filter(s => s.id !== id) })

    const removeRefreshSection = (id: string) =>
        onChange({ refreshSections: (data.refreshSections ?? []).filter(s => s.id !== id) })

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    /**
     * Move `activeId` block inside `sections` so it lands at the position
     * indicated by `overId` and `overIndex`.
     *
     * - overId is a block id  → insert before/at that block's position
     * - overId is a section id → append to that section (empty-section drop)
     *
     * `overIndex` is the sortable index reported by @dnd-kit/sortable's
     * over.data.current.sortable.index — it is the exact visual slot.
     */
    const moveBlock = (
        sections: Section[],
        activeId: string,
        overId: string,
        overIndex: number,
    ): Section[] => {
        // Find source
        let fromSection: Section | undefined
        let foundBlock: Block | undefined
        for (const s of sections) {
            foundBlock = s.blocks.find(b => b.id === activeId)
            if (foundBlock) { fromSection = s; break }
        }
        if (!fromSection || !foundBlock) return sections
        const block = foundBlock
        const fromId = fromSection.id

        // Find destination
        let toSection: Section | undefined
        let toIndex: number

        const overIsBlock = sections.some(s => s.blocks.some(b => b.id === overId))
        if (overIsBlock) {
            // Use the exact sortable index from dnd-kit — this is the visual slot
            toSection = sections.find(s => s.blocks.some(b => b.id === overId))
            toIndex = overIndex
        } else {
            // overId is a section container — drop at end (empty section case)
            toSection = sections.find(s => s.id === overId)
            toIndex = toSection?.blocks.length ?? 0
        }
        if (!toSection) return sections
        const toId = toSection.id

        if (fromId === toId) {
            const oldIdx = fromSection.blocks.findIndex(b => b.id === activeId)
            if (oldIdx === toIndex) return sections
            return sections.map(s =>
                s.id === fromId ? { ...s, blocks: arrayMove(s.blocks, oldIdx, toIndex) } : s,
            )
        }

        return sections.map(s => {
            if (s.id === fromId) return { ...s, blocks: s.blocks.filter(b => b.id !== activeId) }
            if (s.id === toId) {
                const nb = [...s.blocks]
                nb.splice(toIndex, 0, block)
                return { ...s, blocks: nb }
            }
            return s
        })
    }

    const handleDragStart = (event: DragStartEvent) => {
        const id = event.active.id as string
        const allSections = [...data.sections, ...(data.refreshSections ?? [])]

        dragStartSectionsRef.current = data.sections
        dragStartRefreshRef.current = data.refreshSections ?? []

        const isSection = allSections.some(s => s.id === id)
        if (isSection) {
            setActiveSectionId(id)
            return
        }

        // It's a block — figure out which list it lives in
        const isRefreshBlock = (data.refreshSections ?? []).some(s => s.blocks.some(b => b.id === id))
        activeBlockIsRefreshRef.current = isRefreshBlock
        liveBlockSectionsRef.current = isRefreshBlock
            ? (data.refreshSections ?? [])
            : data.sections
        // Track starting section so we can detect cross-section moves in onDragOver
        const startingSections = isRefreshBlock ? (data.refreshSections ?? []) : data.sections
        activeBlockSectionIdRef.current = startingSections.find(s => s.blocks.some(b => b.id === id))?.id ?? null
        setActiveBlockId(id)
    }

    const handleDragOver = (event: DragOverEvent) => {
        if (!activeBlockId) return
        const overId = event.over?.id as string | undefined
        if (!overId || overId === activeBlockId) return

        // Read the exact visual index from dnd-kit's sortable data
        const overIndex: number = (event.over?.data?.current as { sortable?: { index?: number } } | undefined)
            ?.sortable?.index ?? 0

        const next = moveBlock(liveBlockSectionsRef.current, activeBlockId, overId, overIndex)
        if (next === liveBlockSectionsRef.current) return

        // Detect which section the block now lives in after the move
        const newSectionId = next.find(s => s.blocks.some(b => b.id === activeBlockId))?.id ?? null

        const crossedSections = newSectionId !== activeBlockSectionIdRef.current
        liveBlockSectionsRef.current = next

        if (crossedSections) {
            // Block moved into a different section — we MUST call onChange so React
            // re-renders both SortableContexts and the target section shows the placeholder.
            // This is safe because it only fires once per boundary crossing, not on
            // every pointer-move event, so it cannot recurse.
            activeBlockSectionIdRef.current = newSectionId
            if (activeBlockIsRefreshRef.current) {
                onChange({ refreshSections: next })
            } else {
                onChange({ sections: next })
            }
        }
        // Same-section reorders stay ref-only — dnd-kit's CSS transforms handle
        // the visual feedback without needing a React re-render.
    }

    const commitBlockDrag = (overId: string | undefined) => {
        if (!overId) {
            if (activeBlockIsRefreshRef.current) {
                onChange({ refreshSections: dragStartRefreshRef.current })
            } else {
                onChange({ sections: dragStartSectionsRef.current })
            }
            return
        }
        if (activeBlockIsRefreshRef.current) {
            onChange({ refreshSections: liveBlockSectionsRef.current })
        } else {
            onChange({ sections: liveBlockSectionsRef.current })
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const activeId = event.active.id as string
        const overId = event.over?.id as string | undefined

        if (activeSectionId) {
            setActiveSectionId(null)
            if (!overId || activeId === overId) return
            const oldIndex = data.sections.findIndex(s => s.id === activeId)
            const newIndex = data.sections.findIndex(s => s.id === overId)
            if (oldIndex !== -1 && newIndex !== -1)
                onChange({ sections: arrayMove(data.sections, oldIndex, newIndex) })
            return
        }

        if (activeBlockId) {
            setActiveBlockId(null)
            commitBlockDrag(overId)
        }
    }

    const customCollisionDetection = (args: Parameters<typeof closestCenter>[0]) => {
        // For blocks: pointer position first (avoids zero-rect ghost droppables from collapsed sections),
        // fall back to closestCenter only if the pointer isn't inside any droppable rect.
        if (activeBlockId) {
            const hits = pointerWithin(args)
            return hits.length > 0 ? hits : closestCenter(args)
        }
        // For sections: closestCenter is fine — they're always mounted and full-height.
        return closestCenter(args)
    }

    const allSections = [...data.sections, ...(data.refreshSections ?? [])]
    const activeSection = activeSectionId ? allSections.find(s => s.id === activeSectionId) ?? null : null
    const activeSectionIndex = activeSectionId ? data.sections.findIndex(s => s.id === activeSectionId) : -1
    const selectedSection = selectedSectionId ? (allSections.find(s => s.id === selectedSectionId) ?? null) : null
    const selectedSectionIsRefresh = selectedSectionId
        ? (data.refreshSections ?? []).some(s => s.id === selectedSectionId)
        : false

    let activeBlock: Block | null = null
    if (activeBlockId) {
        for (const section of allSections) {
            const b = section.blocks.find(blk => blk.id === activeBlockId)
            if (b) { activeBlock = b; break }
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="flex flex-col min-h-0 flex-1 overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-200 bg-white">
                        <span className="font-semibold uppercase tracking-wide text-xs text-slate-500">Sections</span>
                        <div className="flex-1" />
                        <ViewTabToggle
                            view={view}
                            setView={setView}
                            mainCount={data.sections.length}
                            refreshCount={(data.refreshSections ?? []).length}
                        />
                        <div className="w-px h-4 bg-slate-200 shrink-0" />
                        {view === 'module' ? (
                            <button type="button" onClick={addSection}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200">
                                <Plus className="w-3.5 h-3.5" /> Add Section
                            </button>
                        ) : (
                            <button type="button" onClick={addRefreshSection}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm shadow-teal-200">
                                <Plus className="w-3.5 h-3.5" /> Add Section
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        <AnimatePresence mode="wait" initial={false}>
                            {view === 'module' ? (
                                <motion.div key="module"
                                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
                                >
                                    <SortableContext items={data.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-4">
                                            <AnimatePresence initial={false}>
                                                {data.sections.map((section, i) => (
                                                    <SectionCard key={section.id} section={section} index={i}
                                                        autoFocus={section.id === newestId}
                                                        isSelected={section.id === selectedSectionId}
                                                        onSelect={() => setSelectedSectionId(section.id)}
                                                        onUpdate={patch => updateSection(section.id, patch)}
                                                        onRemove={() => removeSection(section.id)}
                                                        publishAttempted={publishAttempted}
                                                        getToken={getToken}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </SortableContext>
                                    {data.sections.length === 0 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                            <p className="text-sm font-medium">No sections yet</p>
                                            <p className="text-xs text-slate-300">Add a section to start building your module</p>
                                            <button type="button" onClick={addSection}
                                                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200">
                                                <Plus className="w-4 h-4" /> Add First Section
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="refresh"
                                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}
                                >
                                    <SortableContext items={(data.refreshSections ?? []).map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-4">
                                            <AnimatePresence initial={false}>
                                                {(data.refreshSections ?? []).map((section, i) => (
                                                    <SectionCard key={section.id} section={section} index={i}
                                                        autoFocus={section.id === newestRefreshId}
                                                        isSelected={section.id === selectedSectionId}
                                                        onSelect={() => setSelectedSectionId(section.id)}
                                                        onUpdate={patch => updateRefreshSection(section.id, patch)}
                                                        onRemove={() => removeRefreshSection(section.id)}
                                                        publishAttempted={publishAttempted}
                                                        accentColor="teal"
                                                        getToken={getToken}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </SortableContext>
                                    {(data.refreshSections ?? []).length === 0 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                            <p className="text-sm font-medium">No refresh sections yet</p>
                                            <p className="text-xs text-slate-300">Shorter content that reinforces the main module</p>
                                            <button type="button" onClick={addRefreshSection}
                                                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm shadow-teal-200">
                                                <Plus className="w-4 h-4" /> Add First Refresh Section
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <SectionSettingsSidebar
                    selectedSection={selectedSection}
                    onUpdate={selectedSectionIsRefresh ? updateRefreshSection : updateSection}
                />
            </div>

            <DragOverlay dropAnimation={null}>
                {activeSection && (
                    <SectionDragPreview section={activeSection} index={activeSectionIndex} accentColor={view === 'refresh' ? 'teal' : 'purple'} />
                )}
                {activeBlock && <BlockDragPreview block={activeBlock} />}
            </DragOverlay>
        </DndContext>
    )
}
