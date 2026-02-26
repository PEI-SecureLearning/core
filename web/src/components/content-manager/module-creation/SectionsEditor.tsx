import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, GripVertical, Pencil, Plus, Trash2, CheckCircle, SkipForward, Clock, FileText, Image, HelpCircle } from 'lucide-react'
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
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block, BlockType, ModuleFormData, QuestionBlock, RichContentBlock, Section } from './types'
import { emptySection, emptyQuestion, uid } from './constants'
import { SortableBlock, AddBlockMenu } from './BlockComponents'
import { MarkdownBlockEditor } from './MarkdownBlockEditor'
import { RichContentBlockEditor } from './RichContentBlockEditor'
import { QuestionBlockEditor } from './QuestionBlockEditor'
import { SectionSettingsSidebar } from './SectionSettingsSidebar'

function SectionRuleIcons({ section, withTooltips }: { readonly section: Section; readonly withTooltips?: boolean }) {
    if (!section.requireCorrectAnswers && !section.isOptional && !section.minTimeSpent) return null
    if (!withTooltips) {
        return (
            <div className="flex items-center gap-1 flex-shrink-0">
                {section.requireCorrectAnswers && <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                {section.isOptional           && <SkipForward  className="w-3.5 h-3.5 text-blue-600"  />}
                {!!section.minTimeSpent       && <Clock        className="w-3.5 h-3.5 text-orange-600"/>}
            </div>
        )
    }
    return (
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
    )
}

function BlockDragPreview({ block }: { readonly block: Block }) {
    const kindMeta = {
        text:         { label: 'Text',     color: 'bg-blue-50 text-blue-500 border-blue-200'   },
        rich_content: { label: 'Media',    color: 'bg-violet-50 text-violet-500 border-violet-200' },
        question:     { label: 'Question', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    } as const

    const meta = kindMeta[block.kind]

    let preview: string
    if (block.kind === 'text')              preview = block.content.trim().slice(0, 120) || 'Empty text block'
    else if (block.kind === 'rich_content') preview = block.url || `${block.mediaType} block`
    else                                    preview = block.question.text.trim().slice(0, 120) || 'Empty question'

    return (
        <div className="flex gap-2 w-[380px] pointer-events-none rotate-1 opacity-95">
            <GripVertical className="w-4 h-4 text-purple-400 flex-shrink-0 mt-2.5" />
            <div className="flex-1 min-w-0 border-2 border-purple-400 rounded-xl overflow-hidden bg-white shadow-2xl">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${meta.color}`}>
                        {meta.label}
                    </span>
                </div>
                <p className={`px-4 py-3 text-sm truncate ${preview.startsWith('Empty') ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                    {preview}
                </p>
            </div>
        </div>
    )
}

function SectionDragPreview({ section, index }: { readonly section: Section; readonly index: number }) {
    const blockKindCounts = section.blocks.reduce(
        (acc, b) => { acc[b.kind] = (acc[b.kind] ?? 0) + 1; return acc },
        {} as Record<string, number>
    )
    return (
        <div className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-purple-500 w-[340px] rotate-1 opacity-95">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <GripVertical className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-[11px] font-bold rounded px-1.5 py-0.5 text-white bg-purple-500 border border-purple-500 flex-shrink-0 tabular-nums">
                    {index + 1}
                </span>
                <span className={`flex-1 text-sm font-semibold truncate ${section.title ? 'text-slate-800' : 'text-slate-400'}`}>
                    {section.title || 'Untitled section'}
                </span>
                {section.blocks.length > 0 && (
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {section.blocks.length} {section.blocks.length === 1 ? 'block' : 'blocks'}
                    </span>
                )}
                <SectionRuleIcons section={section} />
            </div>
            {section.blocks.length > 0 ? (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white">
                    {!!blockKindCounts['text'] && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            {blockKindCounts['text']}
                        </span>
                    )}
                    {!!blockKindCounts['rich_content'] && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Image className="w-3.5 h-3.5 text-slate-400" />
                            {blockKindCounts['rich_content']}
                        </span>
                    )}
                    {!!blockKindCounts['question'] && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                            {blockKindCounts['question']}
                        </span>
                    )}
                </div>
            ) : (
                <div className="px-4 py-2.5 text-xs text-slate-400 italic">Empty section</div>
            )}
        </div>
    )
}

/* ── Section card ── */
export function SectionCard({ section, index, onUpdate, onRemove, autoFocus = false, isSelected, onSelect, publishAttempted }: {
    readonly section: Section
    readonly index: number
    readonly onUpdate: (patch: Partial<Section>) => void
    readonly onRemove: () => void
    readonly autoFocus?: boolean
    readonly isSelected?: boolean
    readonly onSelect?: () => void
    readonly publishAttempted?: boolean
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
                    publishAttempted={publishAttempted}
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
                publishAttempted={publishAttempted}
            />
        )
    }

    const addBlock = (kind: BlockType) => {
        let newBlock: Block
        if (kind === 'question') {
            newBlock = { id: uid(), kind: 'question', question: emptyQuestion() } as QuestionBlock
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
            className={`flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm transition-all ${
                isSelected 
                    ? 'border-2 border-purple-500 shadow-md' 
                    : 'border border-slate-200 hover:border-purple-300'
            }`}
        >

            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100 relative">
                <button
                    type="button"
                    className={`cursor-grab active:cursor-grabbing text-slate-300 hover:text-purple-400 transition-colors flex-shrink-0 touch-none relative z-10 ${isDragging ? 'text-purple-400' : ''}`}
                    {...attributes}
                    {...listeners}
                    aria-label="Drag to reorder section"
                >
                    <GripVertical className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={onSelect}
                    aria-label={`Select section ${index + 1}`}
                    className={`text-[11px] font-bold rounded px-1.5 py-0.5 flex-shrink-0 tabular-nums relative z-10 transition-colors ${
                        isSelected
                            ? 'text-white bg-purple-500 border border-purple-500'
                            : 'text-purple-600 bg-purple-50 border border-purple-200 hover:bg-purple-100'
                    }`}
                >
                    {index + 1}
                </button>

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

                {section.blocks.length > 0 && (
                    <span className="text-[10px] text-slate-400 flex-shrink-0 relative z-10">
                        {section.blocks.length} {section.blocks.length === 1 ? 'block' : 'blocks'}
                    </span>
                )}

                <SectionRuleIcons section={section} withTooltips />

                <button 
                    type="button" 
                    onClick={() => onUpdate({ collapsed: !section.collapsed })}
                    className="text-slate-400 hover:text-purple-600 transition-colors flex-shrink-0 relative z-10"
                >
                    <motion.div animate={{ rotate: section.collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </button>

                <button 
                    type="button" 
                    onClick={onRemove}
                    className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 relative z-10"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <AnimatePresence>
                {!section.collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="flex flex-col gap-3 p-4">
                            {section.blocks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                    <p className="text-sm font-medium text-slate-500 mb-4">This section is empty</p>
                                    <AddBlockMenu onAdd={addBlock} />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <SortableContext
                                        items={section.blocks.map(b => b.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {section.blocks.map(block => (
                                            <SortableBlock key={block.id} id={block.id}>
                                                {renderBlock(block)}
                                            </SortableBlock>
                                        ))}
                                    </SortableContext>
                                </div>
                            )}
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
export function SectionsEditor({ data, onChange, publishAttempted }: {
    readonly data: ModuleFormData
    readonly onChange: (patch: Partial<ModuleFormData>) => void
    readonly publishAttempted?: boolean
}) {
    const [newestId, setNewestId] = useState<string | null>(null)
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)

    const dragStartSectionsRef  = useRef<Section[]>([])
    const liveBlockSectionsRef  = useRef<Section[]>(data.sections)

    const addSection = () => {
        const s = emptySection()
        setNewestId(s.id)
        setSelectedSectionId(s.id)
        onChange({ sections: [...data.sections, s] })
    }

    const updateSection = (id: string, patch: Partial<Section>) =>
        onChange({ sections: data.sections.map(s => s.id === id ? { ...s, ...patch } : s) })

    const removeSection = (id: string) =>
        onChange({ sections: data.sections.filter(s => s.id !== id) })

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const moveBlock = (sections: Section[], activeId: string, overId: string): Section[] => {
        let fromSection: Section | undefined
        let foundBlock:  Block | undefined
        for (const s of sections) {
            foundBlock = s.blocks.find(b => b.id === activeId)
            if (foundBlock) { fromSection = s; break }
        }
        if (!fromSection || !foundBlock) return sections
        const block = foundBlock

        let toSection: Section | undefined
        let toIndex = 0
        for (const s of sections) {
            const idx = s.blocks.findIndex(b => b.id === overId)
            if (idx !== -1) { toSection = s; toIndex = idx; break }
        }
        if (!toSection) {
            toSection = sections.find(s => s.id === overId)
            toIndex   = toSection?.blocks.length ?? 0
        }
        if (!toSection) return sections

        const fromId = fromSection.id
        const toId   = toSection.id

        if (fromId === toId) {
            const oldIdx = fromSection.blocks.findIndex(b => b.id === activeId)
            if (oldIdx === toIndex) return sections
            return sections.map(s => s.id === fromId ? { ...s, blocks: arrayMove(s.blocks, oldIdx, toIndex) } : s)
        }

        return sections.map(s => {
            if (s.id === fromId) return { ...s, blocks: s.blocks.filter(b => b.id !== activeId) }
            if (s.id === toId)   { const nb = [...s.blocks]; nb.splice(toIndex, 0, block); return { ...s, blocks: nb } }
            return s
        })
    }

    const handleDragStart = (event: DragStartEvent) => {
        const id = event.active.id as string
        dragStartSectionsRef.current = data.sections
        liveBlockSectionsRef.current = data.sections
        if (data.sections.some(s => s.id === id)) {
            setActiveSectionId(id)
        } else {
            setActiveBlockId(id)
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        if (!activeBlockId) return
        const overId = event.over?.id as string | undefined
        if (!overId || overId === activeBlockId) return
        const next = moveBlock(liveBlockSectionsRef.current, activeBlockId, overId)
        if (next !== liveBlockSectionsRef.current) liveBlockSectionsRef.current = next
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const activeId = event.active.id as string
        const overId   = event.over?.id as string | undefined

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
            if (!overId) { onChange({ sections: dragStartSectionsRef.current }); return }
            onChange({ sections: moveBlock(liveBlockSectionsRef.current, activeId, overId) })
        }
    }


    const activeSection      = activeSectionId ? data.sections.find(s => s.id === activeSectionId)       : null
    const activeSectionIndex = activeSectionId ? data.sections.findIndex(s => s.id === activeSectionId)  : -1
    const selectedSection    = selectedSectionId ? (data.sections.find(s => s.id === selectedSectionId) ?? null) : null

    let activeBlock: Block | null = null
    if (activeBlockId) {
        for (const section of data.sections) {
            const b = section.blocks.find(blk => blk.id === activeBlockId)
            if (b) { activeBlock = b; break }
        }
    }

    const customCollisionDetection = (args: Parameters<typeof closestCenter>[0]) => {
        if (activeBlockId) {
            const hits = closestCenter(args)
            return hits.length > 0 ? hits : pointerWithin(args)
        }
        return closestCenter(args)
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
                        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 bg-white">
                            <span className="font-semibold uppercase tracking-wide text-xs text-slate-500">Sections</span>
                            <button type="button" onClick={addSection}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200">
                                <Plus className="w-3.5 h-3.5" /> Add Section
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4">
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
                                                publishAttempted={publishAttempted}
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
                        </div>
                    </div>

                    <SectionSettingsSidebar
                        selectedSection={selectedSection}
                        onUpdate={updateSection}
                    />
                </div>

            <DragOverlay dropAnimation={null}>
                {activeSection && (
                    <SectionDragPreview section={activeSection} index={activeSectionIndex} />
                )}
                {activeBlock && <BlockDragPreview block={activeBlock} />}
            </DragOverlay>
        </DndContext>
    )
}
