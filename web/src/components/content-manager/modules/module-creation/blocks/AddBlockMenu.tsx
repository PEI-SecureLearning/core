import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Image as ImageIcon, ListChecks, Plus } from 'lucide-react'
import type { BlockType } from '../types'
import { useModuleTheme } from '../theme-context'

export function AddBlockMenu({ onAdd }: {
    readonly onAdd: (kind: BlockType) => void
}) {
    const { theme } = useModuleTheme()
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
        { kind: 'text', label: 'Text', icon: <FileText className="w-4 h-4" />, desc: 'Plain or Markdown text' },
        { kind: 'rich_content', label: 'Media', icon: <ImageIcon className="w-4 h-4" />, desc: 'Image, video, audio or file' },
        { kind: 'question', label: 'Question', icon: <ListChecks className="w-4 h-4" />, desc: 'Multiple choice, T/F, or short answer' },
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
                className={`flex items-center gap-1.5 text-xs font-medium ${theme.addText} ${theme.addHover} transition-colors py-1`}
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
                            className="fixed z-50 bg-surface rounded-xl border border-border shadow-xl shadow-slate-200/80 overflow-hidden min-w-[220px]"
                            role="menu"
                        >
                            {options.map(opt => (
                                <button
                                    key={opt.kind}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleSelect(opt.kind)}
                                    className={`flex items-start gap-3 w-full px-4 py-3 ${theme.hover} transition-colors text-left`}
                                >
                                    <span className={`${theme.menuIcon} mt-0.5`} aria-hidden="true">{opt.icon}</span>
                                    <span className="flex flex-col">
                                        <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                                        <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
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
