import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, GripVertical, Trash2 } from 'lucide-react'
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block, BlockType, Question, QuestionBlock, RichContentBlock, Section } from '../types'
import { emptyQuestion, uid } from '../constants'
import { SortableBlock, AddBlockMenu } from '../blocks'
import { MarkdownBlockEditor } from '../blocks/MarkdownBlockEditor'
import { RichContentBlockEditor } from '../blocks/RichContentBlockEditor'
import { QuestionBlockEditor } from '../blocks/QuestionBlockEditor'
import { SectionTitleEditor } from './SectionTitleEditor'
import { SectionRuleIcons } from './SectionRuleIcons'
import { type AccentColor, ThemeProvider, useModuleTheme } from '../theme-context'

export function SectionCard({ section, index, onUpdate, onRemove, autoFocus = false, isSelected, onSelect, publishAttempted, accentColor = 'primary', getToken }: {
    readonly section: Section
    readonly index: number
    readonly onUpdate: (patch: Partial<Section>) => void
    readonly onRemove: () => void
    readonly autoFocus?: boolean
    readonly isSelected?: boolean
    readonly onSelect?: () => void
    readonly publishAttempted?: boolean
    readonly accentColor?: AccentColor
    readonly getToken?: () => string | undefined
}) {
    return (
        <ThemeProvider accent={accentColor}>
            <SectionCardInner
                section={section}
                index={index}
                onUpdate={onUpdate}
                onRemove={onRemove}
                autoFocus={autoFocus}
                isSelected={isSelected}
                onSelect={onSelect}
                publishAttempted={publishAttempted}
                getToken={getToken}
            />
        </ThemeProvider>
    )
}

function SectionCardInner({ section, index, onUpdate, onRemove, autoFocus, isSelected, onSelect, publishAttempted, getToken }: {
    readonly section: Section
    readonly index: number
    readonly onUpdate: (patch: Partial<Section>) => void
    readonly onRemove: () => void
    readonly autoFocus?: boolean
    readonly isSelected?: boolean
    readonly onSelect?: () => void
    readonly publishAttempted?: boolean
    readonly getToken?: () => string | undefined
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
    const titleSizerRef = useRef<HTMLSpanElement>(null)

    const syncTitleWidth = () => {
        const input = titleInputRef.current
        const sizer = titleSizerRef.current
        if (!input || !sizer) return
        sizer.textContent = input.value || input.placeholder || ''
        input.style.width = `${Math.max(sizer.offsetWidth + 4, 0)}px`
    }

    useEffect(() => {
        if (autoFocus) {
            setEditingTitle(true)
            setTimeout(() => {
                titleInputRef.current?.focus()
                syncTitleWidth()
            }, 0)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startEdit = () => {
        setEditingTitle(true)
        setTimeout(() => {
            titleInputRef.current?.focus()
            syncTitleWidth()
        }, 0)
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
                    onUpdate={(q: Question) => patchBlock(block.id, { ...block, question: q })}
                    onRemove={() => removeBlock(block.id)}
                    publishAttempted={publishAttempted}
                />
            )
        }
        if (block.kind === 'rich_content') {
            return (
                <RichContentBlockEditor
                    block={block}
                    onUpdate={(patch: Partial<RichContentBlock>) => patchBlock(block.id, { ...block, ...patch })}
                    onRemove={() => removeBlock(block.id)}
                    getToken={getToken}
                    publishAttempted={publishAttempted}
                />
            )
        }
        return (
            <MarkdownBlockEditor
                block={block}
                onUpdate={(content: string) => patchBlock(block.id, { ...block, content })}
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
            newBlock = { id: uid(), kind: 'rich_content', mediaType: 'image', url: '', contentId: '', caption: '' } as RichContentBlock
        } else {
            newBlock = { id: uid(), kind: 'text', content: '' }
        }
        onUpdate({ blocks: [...section.blocks, newBlock] })
    }

    const titleMissing = !section.title.trim()
    const { theme } = useModuleTheme()

    let cardBorder = `${theme.border} ${theme.borderHover}`
    if (isSelected) cardBorder = theme.borderActive
    else if (publishAttempted && titleMissing) cardBorder = 'border border-warning/50 hover:border-warning'

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            className={`flex flex-col bg-surface rounded-2xl overflow-hidden shadow-sm transition-all cursor-pointer ${cardBorder}`}
        >
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
            <div
                onDoubleClick={() => onUpdate({ collapsed: !section.collapsed })}
                aria-label={`Select section ${index + 1}`}
                className="flex items-center gap-2 px-4 py-3 bg-surface-subtle border-b border-border relative w-full text-left"
            >
                <span
                    className={`cursor-grab active:cursor-grabbing text-muted-foreground/50 ${theme.grip} transition-colors flex-shrink-0 touch-none relative z-10 ${isDragging ? theme.grip.replace('hover:', '') : ''}`}
                    {...attributes}
                    {...listeners}
                    aria-label="Drag to reorder section"
                >
                    <GripVertical className="w-4 h-4" />
                </span>

                {(() => {
                    let badgeCls = theme.badge
                    if (isSelected) badgeCls = theme.badgeActive
                    else if (publishAttempted && titleMissing) badgeCls = 'text-warning bg-warning/10 border border-warning/30'
                    return (
                        <span className={`text-[11px] font-bold rounded px-1.5 py-0.5 flex-shrink-0 tabular-nums relative z-10 transition-colors select-none ${badgeCls}`}>
                            {index + 1}
                        </span>
                    )
                })()}

                <SectionTitleEditor
                    section={section}
                    onUpdate={onUpdate}
                    onStopEdit={() => setEditingTitle(false)}
                    titleMissing={!!publishAttempted && titleMissing}
                    editing={editingTitle}
                    inputRef={titleInputRef}
                    sizerRef={titleSizerRef}
                    syncWidth={syncTitleWidth}
                    onStartEdit={startEdit}
                />

                <div className="flex-1" />

                {section.blocks.length > 0 && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 relative z-10 pointer-events-none">
                        {section.blocks.length} {section.blocks.length === 1 ? 'block' : 'blocks'}
                    </span>
                )}

                <span className="pointer-events-none">
                    <SectionRuleIcons section={section} withTooltips />
                </span>

                <button
                    type="button"
                    onClick={() => onUpdate({ collapsed: !section.collapsed })}
                    className={`text-muted-foreground ${theme.chevron} transition-colors flex-shrink-0 relative z-10`}
                >
                    <motion.div animate={{ rotate: section.collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </button>

                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onRemove() }}
                    className="text-muted-foreground/50 hover:text-error transition-colors flex-shrink-0 relative z-10"
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
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-subtle rounded-lg border-2 border-dashed border-border">
                                    <p className="text-sm font-medium text-muted-foreground mb-4">This section is empty</p>
                                    <AddBlockMenu onAdd={addBlock} />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <SortableContext
                                        items={section.collapsed ? [] : section.blocks.map(b => b.id)}
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
