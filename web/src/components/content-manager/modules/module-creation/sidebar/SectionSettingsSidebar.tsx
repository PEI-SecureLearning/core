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
import type { Section } from '../types'

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
                className={`mt-0.5 w-4 h-4 rounded border-border focus:ring-2 focus:ring-offset-0 cursor-pointer ${iconClass}`}
            />
            <label htmlFor={id} className="flex-1 min-w-0 cursor-pointer">
                <div className={`flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors ${hoverClass}`}>
                    {icon}
                    <span>{label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
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
    const [open, setOpen] = useState(false)

    return (
        <motion.div
            animate={{ width: open ? 280 : 52 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 h-full flex flex-col bg-surface border-l border-border overflow-hidden relative"
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
                            Section Settings
                        </motion.span>
                    )}
                </AnimatePresence>
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="ml-auto text-muted-foreground hover:text-accent-secondary transition-colors flex-shrink-0"
                    title={open ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {open
                        ? <PanelRightClose className="w-4 h-4" />
                        : <PanelRightOpen className="w-4 h-4" />
                    }
                </button>
            </div>

            {!open && (
                <div className="flex flex-col items-center gap-2 py-4 flex-1">
                    <Settings className="w-4 h-4 text-muted-foreground/50 mb-2" />
                    {selectedSection && (
                        <>
                            <button
                                type="button"
                                title={selectedSection.requireCorrectAnswers ? 'Require correct answers: ON' : 'Require correct answers: OFF'}
                                onClick={() => onUpdate(selectedSection.id, { requireCorrectAnswers: !selectedSection.requireCorrectAnswers })}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedSection.requireCorrectAnswers
                                    ? 'bg-success/10 text-success hover:bg-success/20'
                                    : 'text-muted-foreground/50 hover:bg-surface hover:text-success/80'
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                title={selectedSection.isOptional ? 'Optional section: ON' : 'Optional section: OFF'}
                                onClick={() => onUpdate(selectedSection.id, { isOptional: !selectedSection.isOptional })}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedSection.isOptional
                                    ? 'bg-info/10 text-info hover:bg-info/20'
                                    : 'text-muted-foreground/50 hover:bg-surface hover:text-info/80'
                                    }`}
                            >
                                <SkipForward className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                title={selectedSection.minTimeSpent ? `Min time: ${selectedSection.minTimeSpent}s` : 'Min time: OFF'}
                                onClick={() => onUpdate(selectedSection.id, { minTimeSpent: selectedSection.minTimeSpent ? undefined : 30 })}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedSection.minTimeSpent
                                    ? 'bg-warning/10 text-warning hover:bg-warning/20'
                                    : 'text-muted-foreground/50 hover:bg-surface hover:text-warning/80'
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            )}

            <AnimatePresence mode="wait">
                {open && (
                    <motion.div
                        key={selectedSection ? selectedSection.id : 'empty'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-4"
                    >
                        {selectedSection ? (
                            <>
                                <SettingToggle
                                    id="require-correct"
                                    checked={selectedSection.requireCorrectAnswers ?? false}
                                    onChange={v => onUpdate(selectedSection.id, { requireCorrectAnswers: v })}
                                    icon={<CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />}
                                    iconClass="text-success focus:ring-success/30 accent-success"
                                    hoverClass="group-hover:text-success"
                                    label="Require Correct Answers"
                                    description="All questions must be answered correctly before proceeding"
                                />
                                <SettingToggle
                                    id="optional-section"
                                    checked={selectedSection.isOptional ?? false}
                                    onChange={v => onUpdate(selectedSection.id, { isOptional: v })}
                                    icon={<SkipForward className="w-3.5 h-3.5 text-info flex-shrink-0" />}
                                    iconClass="text-info focus:ring-info/30 accent-info"
                                    hoverClass="group-hover:text-info"
                                    label="Optional Section"
                                    description="Users can skip this section and continue"
                                />
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="min-time" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        <Clock className="w-3.5 h-3.5 text-warning flex-shrink-0" />
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
                                        className="w-full text-sm bg-surface-subtle border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-warning/30 text-foreground placeholder:text-muted-foreground"
                                    />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Minimum time before users can proceed
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                                <p className="text-sm font-medium text-foreground">No section selected</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    No section selected for configuration.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
