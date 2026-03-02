import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, FileText, GripVertical, Image as ImageIcon, ListChecks, Plus } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { BlockType } from './types'

export function BlockWarning({ message }: { readonly message: string }) {
    return (
        <div className="flex items-start gap-2 mx-4 mb-3 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{message}</span>
        </div>
    )
}

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
                    isDragging ? 'text-purple-400' : 'text-slate-300 hover:text-purple-400'
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

export function AddBlockMenu({ onAdd }: { readonly onAdd: (kind: BlockType) => void }) {
    const [open, setOpen] = useState(false)
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
    const btnRef = useRef<HTMLButtonElement>(null)

    const handleOpen = useCallback(() => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            const menuWidth = 220
            const menuHeight = 180
            const padding = 8

            let top = rect.bottom + 6
            let left = rect.left

            if (left + menuWidth > window.innerWidth - padding) left = window.innerWidth - menuWidth - padding
            if (left < padding) left = padding
            if (top + menuHeight > window.innerHeight - padding) top = rect.top - menuHeight - 6
            if (top < padding) top = padding

            setMenuPos({ top, left })
        }
        setOpen(o => !o)
    }, [])

    const handleClose = useCallback(() => setOpen(false), [])

    const handleSelect = useCallback((kind: BlockType) => {
        onAdd(kind)
        setOpen(false)
    }, [onAdd])

    const options: { kind: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
        { kind: 'text',         label: 'Text',     icon: <FileText   className="w-4 h-4" />, desc: 'Plain or Markdown text'                   },
        { kind: 'rich_content', label: 'Media',    icon: <ImageIcon  className="w-4 h-4" />, desc: 'Image, video, audio or file'              },
        { kind: 'question',     label: 'Question', icon: <ListChecks className="w-4 h-4" />, desc: 'Multiple choice, T/F, or short answer'    },
    ]

    return (
        <div>
            <button 
                ref={btnRef} 
                type="button" 
                onClick={handleOpen}
                aria-label="Add block"
                aria-expanded={open}
                aria-haspopup="menu"
                className="flex items-center gap-1.5 text-xs font-medium text-purple-500 hover:text-purple-700 transition-colors py-1"
            >
                <Plus className="w-3.5 h-3.5" /> Add block
            </button>
            <AnimatePresence>
                {open && menuPos && (
                    <>
                        <button
                            type="button"
                            aria-label="Close menu"
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={handleClose}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            style={{ top: menuPos.top, left: menuPos.left }}
                            className="fixed z-50 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden min-w-[220px]"
                            role="menu"
                        >
                            {options.map(opt => (
                                <button 
                                    key={opt.kind} 
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleSelect(opt.kind)}
                                    className="flex items-start gap-3 w-full px-4 py-3 hover:bg-purple-50 transition-colors text-left"
                                >
                                    <span className="text-purple-500 mt-0.5" aria-hidden="true">{opt.icon}</span>
                                    <span className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-700">{opt.label}</span>
                                        <span className="text-[11px] text-slate-400">{opt.desc}</span>
                                    </span>
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
