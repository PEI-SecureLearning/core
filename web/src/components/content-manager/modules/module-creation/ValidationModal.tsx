import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ValidationModalProps {
    readonly isOpen: boolean
    readonly onClose: () => void
    readonly missingFields: string[]
}

export function ValidationModal({ isOpen, onClose, missingFields }: ValidationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        type="button"
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default w-full h-full"
                        aria-label="Close dialog"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl overflow-hidden border border-border"
                    >
                        {/* Body */}
                        <div className="flex items-start gap-4 p-6 pb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-foreground">
                                    Incomplete Module
                                </h3>
                                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                                    Please complete the following items before you can save this module:
                                </p>

                                <ul className="mt-4 space-y-2">
                                    {missingFields.map((field) => (
                                        <li key={field} className="flex items-center gap-2.5 text-sm text-foreground/80">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                            {field}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-6 pt-4 bg-surface-subtle border-t border-border">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
