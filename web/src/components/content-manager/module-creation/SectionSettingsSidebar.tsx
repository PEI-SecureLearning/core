import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Settings,
    PanelRightClose,
    PanelRightOpen,
    CheckCircle,
    Clock,
    SkipForward,
} from 'lucide-react'
import type { Section } from './types'

function SettingToggle({ id, checked, onChange, icon, iconClass, label, description, hoverClass }: {
    readonly id: string
    readonly checked: boolean
    readonly onChange: (checked: boolean) => void
    readonly icon: React.ReactNode
    readonly iconClass: string
    readonly hoverClass: string
    readonly label: string
    readonly description: string
}) {
    return (
        <div className="flex items-start gap-2.5 group">
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className={`mt-0.5 w-4 h-4 rounded border-slate-300 focus:ring-2 focus:ring-offset-0 cursor-pointer ${iconClass}`}
            />
            <label htmlFor={id} className="flex-1 min-w-0 cursor-pointer">
                <div className={`flex items-center gap-1.5 text-sm font-semibold text-slate-800 transition-colors ${hoverClass}`}>
                    {icon}
                    <span>{label}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
            </label>
        </div>
    )
}

export function SectionSettingsSidebar({
    selectedSection,
    onUpdate,
}: {
    readonly selectedSection: Section | null
    readonly onUpdate: (sectionId: string, patch: Partial<Section>) => void
}) {
    const [open, setOpen] = useState(true)

    if (!selectedSection) {
        return (
            <motion.div
                animate={{ width: 52 }}
                className="flex-shrink-0 h-full flex flex-col bg-white border-l border-slate-200 overflow-hidden"
            >
                <div className="flex items-center justify-center px-3 py-4 border-b border-slate-100">
                    <button
                        type="button"
                        onClick={() => setOpen(o => !o)}
                        className="text-slate-400 hover:text-purple-600 transition-colors"
                        title="Section settings"
                    >
                        <PanelRightOpen className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex flex-col items-center gap-4 py-4 text-slate-300">
                    <Settings className="w-4 h-4" />
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            animate={{ width: open ? 280 : 52 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 h-full flex flex-col bg-white border-l border-slate-200 overflow-hidden relative"
        >
            <div className="flex items-center justify-between px-3 py-4 border-b border-slate-100">
                <AnimatePresence>
                    {open && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap"
                        >
                            Section Settings
                        </motion.span>
                    )}
                </AnimatePresence>
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="ml-auto text-slate-400 hover:text-purple-600 transition-colors flex-shrink-0"
                    title={open ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {open
                        ? <PanelRightClose className="w-4 h-4" />
                        : <PanelRightOpen  className="w-4 h-4" />
                    }
                </button>
            </div>

            {!open && (
                <div className="flex flex-col items-center gap-4 py-4 flex-1">
                    <Settings className="w-4 h-4 text-slate-300" />
                    <CheckCircle className={`w-4 h-4 transition-colors ${selectedSection.requireCorrectAnswers ? 'text-green-500' : 'text-slate-300'}`} />
                    <SkipForward className={`w-4 h-4 transition-colors ${selectedSection.isOptional        ? 'text-blue-500'  : 'text-slate-300'}`} />
                    <Clock       className={`w-4 h-4 transition-colors ${selectedSection.minTimeSpent      ? 'text-orange-500': 'text-slate-300'}`} />
                </div>
            )}

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-4"
                    >
                        <SettingToggle
                            id="require-correct"
                            checked={selectedSection.requireCorrectAnswers ?? false}
                            onChange={v => onUpdate(selectedSection.id, { requireCorrectAnswers: v })}
                            icon={<CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />}
                            iconClass="text-green-600 focus:ring-green-300 accent-green-600"
                            hoverClass="group-hover:text-green-600"
                            label="Require Correct Answers"
                            description="All questions must be answered correctly before proceeding"
                        />
                        <SettingToggle
                            id="optional-section"
                            checked={selectedSection.isOptional ?? false}
                            onChange={v => onUpdate(selectedSection.id, { isOptional: v })}
                            icon={<SkipForward className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                            iconClass="text-blue-600 focus:ring-blue-300 accent-blue-600"
                            hoverClass="group-hover:text-blue-600"
                            label="Optional Section"
                            description="Users can skip this section and continue"
                        />
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="min-time" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                <Clock className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                                Minimum Time (seconds)
                            </label>
                            <input
                                id="min-time"
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0 (no minimum)"
                                value={selectedSection.minTimeSpent ?? ''}
                                onChange={e => onUpdate(selectedSection.id, {
                                    minTimeSpent: e.target.value ? Number.parseInt(e.target.value, 10) : undefined
                                })}
                                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300/50 text-slate-800 placeholder:text-slate-400"
                            />
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Minimum time before users can proceed
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
