import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Edit3, Eye, X } from 'lucide-react'
import type { TextBlock } from '../types'
import {
    MD_HEADING_OPTIONS,
    MD_INLINE_ACTIONS,
    MD_INSERT_OPTIONS,
    MD_LIST_OPTIONS,
} from '../constants'
import { renderMarkdown } from '../utils'
import { BlockWarning } from './BlockWarning'

function MdDropdown({ label, options, onInsert }: {
    readonly label: string
    readonly options: { label: string; insert: string }[]
    readonly onInsert: (insert: string) => void
}) {
    const [open, setOpen] = useState(false)
    const btnRef = useRef<HTMLButtonElement>(null)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

    const handleOpen = () => {
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            setPos({ top: r.bottom + 4, left: r.left })
        }
        setOpen(o => !o)
    }

    return (
        <div>
            <button ref={btnRef} type="button" onClick={handleOpen}
                className="flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium rounded bg-surface hover:bg-info/10 hover:text-info border border-border transition-colors text-foreground">
                {label}
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>
            <AnimatePresence>
                {open && pos && (
                    <>
                        <button
                            type="button"
                            aria-label="Close"
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.1 }}
                            style={{ top: pos.top, left: pos.left }}
                            className="fixed z-50 bg-surface border border-border rounded-lg shadow-lg overflow-hidden min-w-[120px]"
                        >
                            {options.map(opt => (
                                <button key={opt.label} type="button"
                                    onClick={() => { onInsert(opt.insert); setOpen(false) }}
                                    className="w-full px-3 py-2 text-left text-[12px] font-medium text-foreground hover:bg-info/10 hover:text-info transition-colors">
                                    {opt.label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

export function MarkdownBlockEditor({ block, onUpdate, onRemove, publishAttempted }: {
    readonly block: TextBlock
    readonly onUpdate: (content: string) => void
    readonly onRemove: () => void
    readonly publishAttempted?: boolean
}) {
    const [mode, setMode] = useState<'edit' | 'preview'>('edit')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const showWarning = publishAttempted === true && !block.content.trim()

    useEffect(() => {
        if (textareaRef.current && mode === 'edit') {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [block.content, mode])

    return (
        <div
            aria-label="Text block"
            className={`flex flex-col border rounded-xl overflow-hidden bg-surface group transition-colors ${showWarning ? 'border-warning' : 'border-border'
                }`}
        >
            <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-subtle border-b border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-1 bg-muted-foreground/10 text-muted-foreground">
                    Text
                </span>
                {mode === 'edit' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        <MdDropdown label="Heading" options={MD_HEADING_OPTIONS} onInsert={s => onUpdate(block.content + s)} />
                        {MD_INLINE_ACTIONS.map(({ label, insert, title, labelClass }) => (
                            <button key={label} type="button" title={title}
                                onClick={() => onUpdate(block.content + insert)}
                                className="px-2 py-0.5 text-[11px] font-medium rounded bg-surface hover:bg-surface-subtle border border-border transition-colors text-foreground">
                                <span className={labelClass}>{label}</span>
                            </button>
                        ))}
                        <MdDropdown label="List" options={MD_LIST_OPTIONS} onInsert={s => onUpdate(block.content + s)} />
                        <MdDropdown label="Insert" options={MD_INSERT_OPTIONS} onInsert={s => onUpdate(block.content + s)} />
                    </div>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        {mode === 'edit' && (
                            <span className="text-[10px] text-muted-foreground/60">{block.content.length} chars</span>
                        )}
                    </div>
                    <div className="flex rounded-full border border-border/60 p-1 bg-surface shadow-sm gap-0.5 ml-2">
                        <button type="button" onClick={() => setMode('edit')}
                            title="Edit"
                            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${mode === 'edit'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
                                }`}>
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => setMode('preview')}
                            title="Preview"
                            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${mode === 'preview'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
                                }`}>
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button type="button" onClick={onRemove}
                        title="Remove block"
                        className="ml-0.5 p-1 text-muted-foreground/40 hover:text-error hover:bg-error/10 rounded-md transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <AnimatePresence mode="wait">
                {mode === 'edit' ? (
                    <motion.textarea key="edit"
                        ref={textareaRef}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        value={block.content}
                        onChange={e => onUpdate(e.target.value)}
                        placeholder="Write text with Markdown..."
                        className="font-mono text-sm px-4 py-3 focus:outline-none bg-surface text-foreground placeholder:text-muted-foreground min-h-[80px] border-0 overflow-hidden resize-none"
                    />
                ) : (
                    <motion.div key="preview"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="px-5 py-4 text-sm min-h-[80px]"
                    >
                        {block.content.trim()
                            ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content) }} />
                            : <p className="text-muted-foreground/50 italic">Nothing to preview yet.</p>
                        }
                    </motion.div>
                )}
            </AnimatePresence>

            {showWarning && <BlockWarning message="Text block cannot be empty." />}
        </div>
    )
}
