import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Edit3, Eye, X } from 'lucide-react'
import type { TextBlock } from './types'
import {
    MD_HEADING_OPTIONS,
    MD_INLINE_ACTIONS,
    MD_INSERT_OPTIONS,
    MD_LIST_OPTIONS,
} from './constants'
import { renderMarkdown } from './utils'
import { BlockWarning } from './BlockComponents'

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
                className="flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium rounded bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 transition-colors text-slate-900">
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
                            className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden min-w-[120px]"
                        >
                            {options.map(opt => (
                                <button key={opt.label} type="button"
                                    onClick={() => { onInsert(opt.insert); setOpen(false) }}
                                    className="w-full px-3 py-2 text-left text-[12px] font-medium text-slate-800 hover:bg-purple-50 hover:text-purple-700 transition-colors">
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

    // Auto-resize textarea to fit content
    useEffect(() => {
        if (textareaRef.current && mode === 'edit') {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [block.content, mode])

    return (
        <div 
            aria-label="Text block"
            className={`flex flex-col border rounded-xl overflow-hidden bg-white group transition-colors ${
                showWarning ? 'border-amber-400' : 'border-slate-200'
            }`}
        >
            <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-1 bg-blue-50 text-blue-500">
                    Text
                </span>
                {mode === 'edit' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        <MdDropdown label="Heading" options={MD_HEADING_OPTIONS} onInsert={s => onUpdate(block.content + s)} />
                        {MD_INLINE_ACTIONS.map(({ label, insert, title, labelClass }) => (
                            <button key={label} type="button" title={title}
                                onClick={() => onUpdate(block.content + insert)}
                                className="px-2 py-0.5 text-[11px] font-medium rounded bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 transition-colors text-slate-900">
                                <span className={labelClass}>{label}</span>
                            </button>
                        ))}
                        <MdDropdown label="List"   options={MD_LIST_OPTIONS}   onInsert={s => onUpdate(block.content + s)} />
                        <MdDropdown label="Insert" options={MD_INSERT_OPTIONS} onInsert={s => onUpdate(block.content + s)} />
                    </div>
                )}
                <div className="ml-auto flex items-center gap-1">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        {mode === 'edit' && (
                            <span className="text-[10px] text-slate-400">{block.content.length} chars</span>
                        )}
                    </div>
                    <div className="flex rounded-md border border-slate-200 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        <button type="button" onClick={() => setMode('edit')}
                            className={`flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium transition-colors
                                ${mode === 'edit' ? 'bg-purple-600 text-white' : 'bg-white text-slate-400 hover:text-purple-600'}`}>
                            <Edit3 className="w-2.5 h-2.5" /> Edit
                        </button>
                        <button type="button" onClick={() => setMode('preview')}
                            className={`flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium transition-colors
                                ${mode === 'preview' ? 'bg-purple-600 text-white' : 'bg-white text-slate-400 hover:text-purple-600'}`}>
                            <Eye className="w-2.5 h-2.5" /> Preview
                        </button>
                    </div>
                    <button type="button" onClick={onRemove}
                        className="ml-1 text-slate-300 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
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
                        className="font-mono text-sm px-4 py-3 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 min-h-[80px] border-0 overflow-hidden resize-none"
                    />
                ) : (
                    <motion.div key="preview"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="px-5 py-4 text-sm min-h-[80px]"
                    >
                        {block.content.trim()
                            ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content) }} />
                            : <p className="text-slate-300 italic">Nothing to preview yet.</p>
                        }
                    </motion.div>
                )}
            </AnimatePresence>

            {showWarning && <BlockWarning message="Text block cannot be empty." />}
        </div>
    )
}
