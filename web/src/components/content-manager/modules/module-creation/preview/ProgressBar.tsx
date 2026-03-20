import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ModuleFormData } from '../types'
import { calcCompletion, getMissingFields } from '../utils'

export function ProgressBar({ data }: { readonly data: ModuleFormData }) {
    const pct = calcCompletion(data)
    const missing = getMissingFields(data)
    const [tipVisible, setTipVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [tipPos, setTipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

    let barColor = 'bg-amber-400'
    if (pct === 100) barColor = 'bg-green-500'
    else if (pct >= 60) barColor = 'bg-[#7C3AED]'

    let labelColor = 'text-amber-500'
    if (pct === 100) labelColor = 'text-green-600'
    else if (pct >= 60) labelColor = 'text-[#A78BFA]'

    const handleMouseMove = (e: React.MouseEvent) => {
        const popoverWidth = 240
        const x = e.clientX
        const y = e.clientY

        // Horizontal clamping
        let left = x - (popoverWidth / 2)
        if (left < 12) left = 12
        if (left + popoverWidth > window.innerWidth - 12) left = window.innerWidth - popoverWidth - 12

        setTipPos({ top: y + 20, left })
    }

    const showTip = () => setTipVisible(true)
    const hideTip = () => setTipVisible(false)

    return (
        <div
            ref={containerRef}
            onMouseEnter={showTip}
            onMouseMove={handleMouseMove}
            onMouseLeave={hideTip}
            className="group cursor-help"
        >
            <AnimatePresence>
                {pct < 100 && (
                    <motion.div
                        key="bar"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-6 py-2 border-b border-border bg-surface/60 backdrop-blur-sm transition-colors group-hover:bg-surface-subtle">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                                Completion
                            </span>
                            <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${barColor}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                />
                            </div>
                            <span className={`text-[11px] font-bold w-12 text-right ${labelColor}`}>
                                {pct}%
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tooltip — hoverable so user can read it */}
            <AnimatePresence>
                {tipVisible && missing.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        style={{ top: tipPos.top, left: tipPos.left }}
                        className="fixed z-[70] bg-surface border border-border rounded-xl shadow-xl shadow-slate-200/60 px-4 py-3 min-w-[200px] pointer-events-none"
                    >
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Missing Items</p>
                        <ul className="flex flex-col gap-1.5">
                            {missing.map(item => (
                                <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
