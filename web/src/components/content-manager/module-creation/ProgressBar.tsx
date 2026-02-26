import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ModuleFormData } from './types'
import { calcCompletion, totalBlocks } from './utils'

export function ProgressBar({ data, waveActive }: { readonly data: ModuleFormData; readonly waveActive?: number }) {
    const pct = calcCompletion(data)
    const [tipVisible, setTipVisible] = useState(false)
    const hoveringRef = useRef(false)
    const btnRef  = useRef<HTMLButtonElement>(null)
    const barRef  = useRef<HTMLDivElement>(null)
    const [tipPos,  setTipPos]  = useState<{ top: number; left: number }>({ top: 0, left: 0 })
    const [dropPos, setDropPos] = useState<{ x: number; y: number } | null>(null)
    const waveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    let barColor = 'bg-amber-400'
    if (pct === 100) barColor = 'bg-green-500'
    else if (pct >= 60) barColor = 'bg-purple-500'

    let labelColor = 'text-amber-500'
    if (pct === 100) labelColor = 'text-green-600'
    else if (pct >= 60) labelColor = 'text-purple-600'

    const missing = [
        !data.title.trim()         && 'Title',
        !data.category             && 'Category',
        !data.description.trim()   && 'Description',
        !data.estimatedTime.trim() && 'Duration',
        data.sections.length === 0 && 'Sections',
        totalBlocks(data) === 0    && 'Content',
        !data.coverImage           && 'Cover image',
    ].filter(Boolean) as string[]

    const computeTipPos = () => {
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            const popoverWidth = 180
            const left = Math.min(r.right - popoverWidth, window.innerWidth - popoverWidth - 12)
            setTipPos({ top: r.bottom + 6, left: Math.max(8, left) })
        }
    }

    const showTip = () => { computeTipPos(); setTipVisible(true) }
    const hideTip = () => setTipVisible(false)

    // When waveActive increments, spawn a droplet centred on the ? button
    useEffect(() => {
        if (!waveActive) return

        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            setDropPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        }

        // Clear any running timer so rapid clicks reset cleanly
        if (waveTimerRef.current) clearTimeout(waveTimerRef.current)
        waveTimerRef.current = setTimeout(() => {
            setDropPos(null)
        }, 1200)

        return () => {
            if (waveTimerRef.current) clearTimeout(waveTimerRef.current)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waveActive])

    return (
        <>
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
                        <div className="flex items-center gap-3 px-6 py-2 border-b border-slate-200 bg-white/60 backdrop-blur-sm">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                                Completion
                            </span>
                            <div ref={barRef} className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${barColor}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                />
                            </div>
                            <span className={`text-[11px] font-bold w-8 text-right ${labelColor}`}>
                                {pct}%
                            </span>
                            {missing.length > 0 && (
                                <button
                                    ref={btnRef}
                                    type="button"
                                    onMouseEnter={() => { hoveringRef.current = true;  showTip() }}
                                    onMouseLeave={() => { hoveringRef.current = false; hideTip() }}
                                    onFocus={showTip}
                                    onBlur={hideTip}
                                    className="w-4 h-4 rounded-full bg-slate-200 hover:bg-amber-100 text-slate-500 hover:text-amber-600 text-[10px] font-bold flex items-center justify-center transition-colors flex-shrink-0"
                                    aria-label="Show missing fields"
                                >
                                    ?
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Droplet wave — originates from the ? button */}
            <AnimatePresence>
                {dropPos && (
                    <>
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0.65, scale: 0 }}
                                animate={{ opacity: 0,    scale: 4 + i * 1.4 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.65, delay: i * 0.1, ease: 'easeOut' }}
                                style={{
                                    position: 'fixed',
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    backgroundColor: '#fbbf24',
                                    top:  dropPos.y - 8,
                                    left: dropPos.x - 8,
                                    pointerEvents: 'none',
                                    zIndex: 60,
                                    transformOrigin: 'center',
                                }}
                            />
                        ))}
                        <motion.div
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ opacity: 0, scale: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            style={{
                                position: 'fixed',
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: '#f59e0b',
                                top:  dropPos.y - 5,
                                left: dropPos.x - 5,
                                pointerEvents: 'none',
                                zIndex: 61,
                            }}
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Tooltip — hoverable so user can read it */}
            <AnimatePresence>
                {tipVisible && missing.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0,  scale: 1    }}
                        exit={{ opacity: 0,    y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        style={{ top: tipPos.top, left: tipPos.left }}
                        className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 px-4 py-3 min-w-[160px]"
                        onMouseEnter={() => { hoveringRef.current = true;  setTipVisible(true) }}
                        onMouseLeave={() => { hoveringRef.current = false; setTipVisible(false) }}
                    >
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Missing</p>
                        <ul className="flex flex-col gap-1">
                            {missing.map(item => (
                                <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
