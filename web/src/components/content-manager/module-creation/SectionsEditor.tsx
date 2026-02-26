import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, GripVertical, Pencil, Plus, Trash2, CheckCircle, SkipForward, Clock } from 'lucide-react'
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
    pointerWithin,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block, BlockType, ModuleFormData, QuestionBlock, RichContentBlock, Section } from './types'
import { emptySection, uid } from './constants'
import { SortableBlock, AddBlockMenu } from './BlockComponents'
import { MarkdownBlockEditor } from './MarkdownBlockEditor'
import { RichContentBlockEditor } from './RichContentBlockEditor'
import { QuestionBlockEditor } from './QuestionBlockEditor'
import { SectionSettingsSidebar } from './SectionSettingsSidebar'

/* ── Section card ── */
export function SectionCard({ section, index, onUpdate, onRemove, autoFocus = false, isSelected, onSelect }: {
    readonly section: Section
    readonly index: number
    readonly onUpdate: (patch: Partial<Section>) => void
    readonly onRemove: () => void
    readonly autoFocus?: boolean
    readonly isSelected?: boolean
    readonly onSelect?: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
    }

    const [editingTitle, setEditingTitle] = useState(false)
    const titleInputRef = useRef<HTMLInputElement>(null)

    // Auto-enter title edit mode when the card first mounts (new section)
    useEffect(() => {
        if (autoFocus) {
            setEditingTitle(true)
            setTimeout(() => titleInputRef.current?.focus(), 0)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startEdit = () => {
        setEditingTitle(true)
        setTimeout(() => titleInputRef.current?.focus(), 0)
    }

    const patchBlock = (blockId: string, newBlock: Block) =>
        onUpdate({ blocks: section.blocks.map(b => b.id === blockId ? newBlock : b) })

    const removeBlock = (blockId: string) =>
        onUpdate({ blocks: section.blocks.filter(b => b.id !== blockId) })

    const renderBlock = (block: Block) => {
        if (block.kind === 'question') {
            return (
                <QuestionBlockEditor
                    block={block}
                    onUpdate={q => patchBlock(block.id, { ...block, question: q })}
                    onRemove={() => removeBlock(block.id)}
                />
            )
        }
        if (block.kind === 'rich_content') {
            return (
                <RichContentBlockEditor
                    block={block}
                    onUpdate={patch => patchBlock(block.id, { ...block, ...patch })}
                    onRemove={() => removeBlock(block.id)}
                />
            )
        }
        return (
            <MarkdownBlockEditor
                block={block}
                onUpdate={content => patchBlock(block.id, { ...block, content })}
                onRemove={() => removeBlock(block.id)}
            />
        )
    }

    const addBlock = (kind: BlockType) => {
        let newBlock: Block
        if (kind === 'question') {
            newBlock = { id: uid(), kind: 'question', question: { id: uid(), type: 'multiple_choice', text: '', choices: [{ id: uid(), text: '', isCorrect: false }, { id: uid(), text: '', isCorrect: false }], answer: '' } } as QuestionBlock
        } else if (kind === 'rich_content') {
            newBlock = { id: uid(), kind: 'rich_content', mediaType: 'image', url: '', caption: '' } as RichContentBlock
        } else {
            newBlock = { id: uid(), kind: 'text', content: '' }
        }
        onUpdate({ blocks: [...section.blocks, newBlock] })
    }

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className={`flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm transition-all cursor-pointer ${
                isSelected 
                    ? 'border-2 border-purple-500 shadow-md' 
                    : 'border border-slate-200 hover:border-purple-300'
            }`}
            onClick={(e) => {
                // Select section when clicking anywhere, unless clicking on an interactive element
                const target = e.target as HTMLElement
                if (!target.closest('button') && !target.closest('input') && !target.closest('textarea') && !target.closest('select')) {
                    onSelect?.()
                }
            }}
        >

            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100 relative">
                {/* Drag handle */}
                <button
                    type="button"
                    className={`cursor-grab active:cursor-grabbing text-slate-300 hover:text-purple-400 transition-colors flex-shrink-0 touch-none relative z-10 ${isDragging ? 'text-purple-400' : ''}`}
                    {...attributes}
                    {...listeners}
                    aria-label="Drag to reorder section"
                >
                    <GripVertical className="w-4 h-4" />
                </button>

                {/* Section number badge */}
                <span className="text-[11px] font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 flex-shrink-0 tabular-nums relative z-10">
                    {index + 1}
                </span>

                {/* Editable title */}
                {editingTitle ? (
                    <input
                        ref={titleInputRef}
                        value={section.title}
                        onChange={e => onUpdate({ title: e.target.value })}
                        onBlur={() => setEditingTitle(false)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false) }}
                        placeholder="Section title..."
                        className="flex-1 text-sm font-semibold text-slate-800 bg-white border border-purple-300 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-purple-300/40 min-w-0 relative z-10"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={startEdit}
                        className="flex-1 flex items-center gap-1.5 min-w-0 group text-left relative z-10"
                    >
                        <span className={`text-sm font-semibold truncate ${section.title ? 'text-slate-800' : 'text-slate-400'}`}>
                            {section.title || 'Untitled section'}
                        </span>
                        <Pencil className="w-3 h-3 text-slate-300 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                    </button>
                )}

                {/* Block count */}
                {section.blocks.length > 0 && (
                    <span className="text-[10px] text-slate-400 flex-shrink-0 relative z-10">
                        {section.blocks.length} {section.blocks.length === 1 ? 'block' : 'blocks'}
                    </span>
                )}

                {/* Active rules indicators */}
                <div className="flex items-center gap-1 flex-shrink-0 relative z-10">
                    {section.requireCorrectAnswers && (
                        <div className="group relative">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Correct answers required
                            </span>
                        </div>
                    )}
                    {section.isOptional && (
                        <div className="group relative">
                            <SkipForward className="w-3.5 h-3.5 text-blue-600" />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Optional section
                            </span>
                        </div>
                    )}
                    {section.minTimeSpent && section.minTimeSpent > 0 && (
                        <div className="group relative">
                            <Clock className="w-3.5 h-3.5 text-orange-600" />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Min. {section.minTimeSpent}s required
                            </span>
                        </div>
                    )}
                </div>

                {/* Collapse */}
                <button 
                    type="button" 
                    onClick={() => onUpdate({ collapsed: !section.collapsed })}
                    className="text-slate-400 hover:text-purple-600 transition-colors flex-shrink-0 relative z-10"
                >
                    <motion.div animate={{ rotate: section.collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </button>

                {/* Delete section */}
                <button 
                    type="button" 
                    onClick={onRemove}
                    className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 relative z-10"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Blocks */}
            <AnimatePresence>
                {!section.collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex flex-col gap-3 p-4">
                            {/* Droppable area for blocks */}
                            <SortableContext
                                items={section.blocks.map(b => b.id)}
                                strategy={verticalListSortingStrategy}
                                id={section.id}
                            >
                                {section.blocks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                        <p className="text-sm font-medium text-slate-500 mb-4">This section is empty</p>
                                        <AddBlockMenu onAdd={addBlock} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {section.blocks.map(block => (
                                            <SortableBlock key={block.id} id={block.id}>
                                                {renderBlock(block)}
                                            </SortableBlock>
                                        ))}
                                    </div>
                                )}
                            </SortableContext>

                            {/* Add block - only show when there are existing blocks */}
                            {section.blocks.length > 0 && (
                                <div className="pt-1 pl-6">
                                    <AddBlockMenu onAdd={addBlock} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ── Sections editor ── */
export function SectionsEditor({ data, onChange }: {
    readonly data: ModuleFormData
    readonly onChange: (patch: Partial<ModuleFormData>) => void
}) {
    const [newestId, setNewestId] = useState<string | null>(null)
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)

    const addSection = () => {
        const s = emptySection()
        setNewestId(s.id)
        setSelectedSectionId(s.id) // Auto-select newly created section
        onChange({ sections: [...data.sections, s] })
    }

    const updateSection = (id: string, patch: Partial<Section>) =>
        onChange({ sections: data.sections.map(s => s.id === id ? { ...s, ...patch } : s) })

    const removeSection = (id: string) =>
        onChange({ sections: data.sections.filter(s => s.id !== id) })

    // Sensors for both sections and blocks
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const activeId = active.id as string
        
        // Check if dragging a section or a block
        const isSection = data.sections.some(s => s.id === activeId)
        if (isSection) {
            setActiveSectionId(activeId)
        } else {
            setActiveBlockId(activeId)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        
        const activeId = active.id as string
        const overId = over?.id as string

        // Handle section reordering
        if (activeSectionId) {
            setActiveSectionId(null)
            
            // If no valid drop target, do nothing
            if (!over || activeId === overId) return
            
            const oldIndex = data.sections.findIndex(s => s.id === activeId)
            const newIndex = data.sections.findIndex(s => s.id === overId)
            if (oldIndex !== -1 && newIndex !== -1) {
                onChange({ sections: arrayMove(data.sections, oldIndex, newIndex) })
            }
            return
        }

        // Handle block reordering/moving
        if (activeBlockId) {
            setActiveBlockId(null)
            
            // If no valid drop target, keep block in place (don't remove it)
            if (!over) return
            
            // Find which section the block is being dragged from
            let fromSectionId: string | null = null
            let blockToMove: Block | null = null
            
            for (const section of data.sections) {
                const block = section.blocks.find(b => b.id === activeId)
                if (block) {
                    fromSectionId = section.id
                    blockToMove = block
                    break
                }
            }
            
            if (!fromSectionId || !blockToMove) return

            // Determine target section
            // Check if overId is a block or a section
            let toSectionId: string | null = null
            let overBlockIndex = -1
            
            for (const section of data.sections) {
                const blockIndex = section.blocks.findIndex(b => b.id === overId)
                if (blockIndex !== -1) {
                    toSectionId = section.id
                    overBlockIndex = blockIndex
                    break
                }
            }
            
            // If didn't find a block, check if overId is a section (for dropping into empty sections or section headers)
            if (!toSectionId) {
                const targetSection = data.sections.find(s => s.id === overId)
                if (targetSection) {
                    toSectionId = targetSection.id
                    overBlockIndex = targetSection.blocks.length
                }
            }
            
            // If still no valid target, keep block in original position
            if (!toSectionId) return

            // If dropping in the same position, do nothing
            if (fromSectionId === toSectionId) {
                const oldIndex = data.sections.find(s => s.id === fromSectionId)?.blocks.findIndex(b => b.id === activeId)
                if (oldIndex === overBlockIndex || oldIndex === overBlockIndex - 1) return
            }

            // Create updated sections
            const updatedSections = data.sections.map(section => {
                // If moving within same section, use arrayMove
                if (fromSectionId === toSectionId && section.id === fromSectionId) {
                    const oldIndex = section.blocks.findIndex(b => b.id === activeId)
                    const newIndex = overBlockIndex
                    return {
                        ...section,
                        blocks: arrayMove(section.blocks, oldIndex, newIndex)
                    }
                }
                
                // Remove block from source section
                if (section.id === fromSectionId) {
                    return {
                        ...section,
                        blocks: section.blocks.filter(b => b.id !== activeId)
                    }
                }
                
                // Add block to target section
                if (section.id === toSectionId) {
                    const newBlocks = [...section.blocks]
                    newBlocks.splice(overBlockIndex, 0, blockToMove)
                    return {
                        ...section,
                        blocks: newBlocks
                    }
                }
                
                return section
            })
            
            onChange({ sections: updatedSections })
        }
    }

    const activeSection = activeSectionId ? data.sections.find(s => s.id === activeSectionId) : null
    const selectedSection = selectedSectionId ? data.sections.find(s => s.id === selectedSectionId) ?? null : null
    
    // Find active block for drag overlay
    let activeBlock: Block | null = null
    if (activeBlockId) {
        for (const section of data.sections) {
            const block = section.blocks.find(b => b.id === activeBlockId)
            if (block) {
                activeBlock = block
                break
            }
        }
    }
    
    // Custom collision detection to handle both sections and blocks properly
    const customCollisionDetection = (args: any) => {
        // If dragging a block, use closestCenter to find the nearest block or section
        if (activeBlockId) {
            // First try to find collisions with other blocks
            const blockCollisions = closestCenter(args)
            if (blockCollisions.length > 0) {
                return blockCollisions
            }
            // If no block collisions, try sections (for empty sections)
            return pointerWithin(args)
        }
        // If dragging a section, only collide with other sections
        return closestCenter(args)
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* Main sections area */}
                <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold uppercase tracking-wide">Sections</span>
                    </div>
                    <button type="button" onClick={addSection}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200">
                        <Plus className="w-3.5 h-3.5" /> Add Section
                    </button>
                </div>

                {/* Section list */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {/* Only sections in the top-level sortable context */}
                    <SortableContext
                        items={data.sections.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-4">
                            <AnimatePresence initial={false}>
                                {data.sections.map((section, i) => (
                                    <SectionCard
                                        key={section.id}
                                        section={section}
                                        index={i}
                                        autoFocus={section.id === newestId}
                                        isSelected={section.id === selectedSectionId}
                                        onSelect={() => setSelectedSectionId(section.id)}
                                        onUpdate={patch => updateSection(section.id, patch)}
                                        onRemove={() => removeSection(section.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </SortableContext>
                    <DragOverlay dropAnimation={null}>
                        {activeSection && (
                            <div className="bg-purple-600 text-white px-4 py-3 rounded-xl shadow-2xl border-2 border-purple-400 flex items-center gap-2 w-fit max-w-[240px]">
                                <GripVertical className="w-5 h-5 flex-shrink-0" />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="font-bold text-sm truncate">
                                        {activeSection.title || 'Untitled Section'}
                                    </span>
                                    <span className="text-xs text-purple-200 truncate">
                                        {activeSection.blocks.length} block{activeSection.blocks.length === 1 ? '' : 's'}
                                    </span>
                                </div>
                            </div>
                        )}
                        {activeBlock && (
                            <div className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-2xl border-2 border-purple-400 flex items-center gap-2 w-fit max-w-[180px]">
                                <GripVertical className="w-4 h-4" />
                                <span className="font-semibold text-sm truncate">
                                    {activeBlock.kind === 'text' && 'Text Block'}
                                    {activeBlock.kind === 'rich_content' && 'Media Block'}
                                    {activeBlock.kind === 'question' && 'Question Block'}
                                </span>
                            </div>
                        )}
                    </DragOverlay>

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
                </div>
                </div>

                {/* Section Settings Sidebar (Right) */}
                <SectionSettingsSidebar
                    selectedSection={selectedSection}
                    onUpdate={updateSection}
                />
            </div>
        </DndContext>
    )
}
