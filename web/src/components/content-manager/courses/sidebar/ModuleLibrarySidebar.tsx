import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Library,
    PanelRightClose,
    PanelRightOpen,
} from 'lucide-react'
import { AvailableModuleList } from '../AvailableModuleList'

export function ModuleLibrarySidebar({ selectedIds }: { readonly selectedIds: string[] }) {
    const [open, setOpen] = useState(true)

    return (
        <motion.div
            animate={{ width: open ? 320 : 52 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="shrink-0 h-full flex flex-col bg-surface border-l border-border overflow-hidden relative"
        >
            <div className="flex items-center justify-between px-3 py-4 border-b border-border">
                <AnimatePresence>
                    {open && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap"
                        >
                            Library
                        </motion.span>
                    )}
                </AnimatePresence>
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="ml-auto text-muted-foreground hover:text-[#A78BFA] transition-colors shrink-0"
                    title={open ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {open
                        ? <PanelRightClose className="w-4 h-4" />
                        : <PanelRightOpen className="w-4 h-4" />
                    }
                </button>
            </div>

            {!open && (
                <div className="flex flex-col items-center gap-4 py-8 text-muted-foreground/50 flex-1">
                    <Library className="w-5 h-5" />
                </div>
            )}

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 overflow-hidden"
                    >
                        <AvailableModuleList selectedIds={selectedIds} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
