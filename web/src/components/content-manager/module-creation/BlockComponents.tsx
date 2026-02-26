import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, GripVertical, Image as ImageIcon, ListChecks, Plus } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { BlockType } from './types'

/* ── Sortable block wrapper ── */
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
            {/* Drag handle — activator node kept separate from sortable node */}
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

/* ── Add-block menu ── */
export function AddBlockMenu({ onAdd }: { readonly onAdd: (kind: BlockType) => void }) {
    const [open, setOpen] = useState(false)
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
    const btnRef = useRef<HTMLButtonElement>(null)

    const handleOpen = useCallback(() => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            const menuWidth = 220 // min-w-[220px]
            const menuHeight = 180 // Approximate height for 3 options
            const padding = 8 // Padding from viewport edges
            
            let top = rect.bottom + 6
            let left = rect.left
            
            // Check if menu goes off right edge
            if (left + menuWidth > window.innerWidth - padding) {
                left = window.innerWidth - menuWidth - padding
            }
            
            // Check if menu goes off left edge
            if (left < padding) {
                left = padding
            }
            
            // Check if menu goes off bottom edge
            if (top + menuHeight > window.innerHeight - padding) {
                // Position above the button instead
                top = rect.top - menuHeight - 6
            }
            
            // Check if menu goes off top edge (in case button is very high)
            if (top < padding) {
                top = padding
            }
            
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
