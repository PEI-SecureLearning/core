import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Clock,
    AlignLeft,
    PanelLeftClose,
    PanelLeftOpen,
    Image as ImageIcon,
    AlertTriangle,
    X,
} from 'lucide-react'
import type { ModuleFormData } from '../types'
import { CATEGORY_OPTIONS, DIFFICULTY_COLORS, inputCls } from '../constants'
import { ContentFilePicker } from '../ContentFilePicker'

const API_BASE = import.meta.env.VITE_API_URL as string

function FormField({ label, icon, warning, children }: {
    readonly label: string
    readonly icon?: React.ReactNode
    readonly warning?: boolean
    readonly children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {icon && <span className="text-[#A78BFA]">{icon}</span>}
                {label}
                {warning && <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />}
            </label>
            {children}
        </div>
    )
}

type Warnings = { cover: boolean; title: boolean; category: boolean; duration: boolean; desc: boolean }

function SidebarFields({ data, onChange, warnings, onBrowseCover }: {
    readonly data: ModuleFormData
    readonly onChange: (patch: Partial<ModuleFormData>) => void
    readonly warnings: Warnings
    readonly onBrowseCover: () => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 px-3 py-4 overflow-y-auto flex-1"
        >
            {/* Cover image — clickable area */}
            <div className="relative group">
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div
                    onClick={onBrowseCover}
                    className={`relative w-full h-24 rounded-xl border-2 overflow-hidden cursor-pointer transition-colors ${
                        warnings.cover
                            ? 'border-amber-300 hover:border-amber-400'
                            : 'border-border hover:border-[#7C3AED]/60'
                    }`}
                >
                    {data.coverImage ? (
                        <img src={data.coverImage} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground group-hover:text-[#A78BFA] transition-colors">
                            <div className="relative">
                                <ImageIcon className="w-5 h-5" />
                                {warnings.cover && (
                                    <AlertTriangle className="w-3 h-3 text-amber-400 absolute -top-1 -right-2" />
                                )}
                            </div>
                            <span className="text-[10px]">Click to choose cover</span>
                        </div>
                    )}
                    {/* Hover overlay when image is set */}
                    {data.coverImage && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>
                {/* Clear button — only when image is set */}
                {data.coverImage && (
                    <button
                        type="button"
                        onClick={() => onChange({ coverImage: '', coverImageId: '' })}
                        className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-colors z-10"
                        aria-label="Remove cover image"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            <FormField label="Title" warning={warnings.title}>
                <input
                    value={data.title}
                    onChange={e => onChange({ title: e.target.value })}
                    placeholder="Module title..."
                    className={`w-full bg-transparent border-b-2 px-0 py-1.5 text-base font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors ${warnings.title
                            ? 'border-amber-300 focus:border-[#7C3AED]/60'
                            : 'border-border focus:border-[#7C3AED]/60'
                        }`}
                />
            </FormField>

            <FormField label="Category" warning={warnings.category}>
                <select
                    value={data.category}
                    onChange={e => onChange({ category: e.target.value })}
                    className={`${inputCls} ${warnings.category ? 'border-amber-300' : ''}`}
                >
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </FormField>

            <FormField label="Difficulty">
                <div className="flex gap-1.5">
                    {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                        <button key={d} type="button"
                            onClick={() => onChange({ difficulty: d })}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all
                                ${data.difficulty === d
                                    ? DIFFICULTY_COLORS[d] + ' shadow-sm'
                                    : 'bg-surface-subtle text-muted-foreground border-border hover:border-border'}`}>
                            {d}
                        </button>
                    ))}
                </div>
            </FormField>

            <FormField label="Duration" warning={warnings.duration}>
                <input
                    value={data.estimatedTime}
                    onChange={e => onChange({ estimatedTime: e.target.value })}
                    placeholder="e.g. 45 minutes"
                    className={`${inputCls} ${warnings.duration ? 'border-amber-300' : ''}`}
                />
            </FormField>

            <FormField label="Description" warning={warnings.desc}>
                <textarea
                    value={data.description}
                    onChange={e => onChange({ description: e.target.value })}
                    placeholder="Brief description..."
                    rows={4}
                    className={`${inputCls} resize-none ${warnings.desc ? 'border-amber-300' : ''}`}
                />
            </FormField>
        </motion.div>
    )
}

export function DetailsSidebar({ data, onChange, publishAttempted, getToken }: {
    readonly data: ModuleFormData
    readonly onChange: (patch: Partial<ModuleFormData>) => void
    readonly publishAttempted?: boolean
    readonly getToken?: () => string | undefined
}) {
    const [open,       setOpen]       = useState(true)
    const [pickerOpen, setPickerOpen] = useState(false)

    // When loaded from backend, coverImageId is set but coverImage (preview URL) is empty.
    // Fetch the file so the cover thumbnail renders.
    useEffect(() => {
        if (!data.coverImageId || data.coverImage) return
        const token = getToken?.()
        let revoked = false
        fetch(`${API_BASE}/content/${encodeURIComponent(data.coverImageId)}/file`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(r => r.ok ? r.blob() : Promise.reject(new Error('not ok')))
            .then(blob => { if (!revoked) onChange({ coverImage: URL.createObjectURL(blob) }) })
            .catch(() => { /* thumbnail stays empty */ })
        return () => { revoked = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.coverImageId])

    const w = publishAttempted ?? false
    const warnings: Warnings = {
        cover:    w && !data.coverImageId,
        title:    w && data.title.trim() === '',
        category: w && data.category === '',
        duration: w && data.estimatedTime.trim() === '',
        desc:     w && data.description.trim() === '',
    }

    const toggleOpen = useCallback(() => setOpen(o => !o), [])

    return (
        <>
        <motion.div
            animate={{ width: open ? 240 : 52 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 h-full flex flex-col bg-surface border-r border-border overflow-hidden relative"
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
                            Module Details
                        </motion.span>
                    )}
                </AnimatePresence>
                <button
                    type="button"
                    onClick={toggleOpen}
                    className="ml-auto text-muted-foreground hover:text-[#A78BFA] transition-colors flex-shrink-0"
                    title={open ? 'Collapse sidebar' : 'Expand sidebar'}
                    aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
                    aria-expanded={open}
                >
                    {open
                        ? <PanelLeftClose className="w-4 h-4" />
                        : <PanelLeftOpen className="w-4 h-4" />
                    }
                </button>
            </div>

            {!open && (
                <div className="flex flex-col items-center gap-4 py-4 text-muted-foreground/50 flex-1">
                    <ImageIcon className="w-4 h-4" />
                    <Clock className="w-4 h-4" />
                    <AlignLeft className="w-4 h-4" />
                </div>
            )}

            <AnimatePresence>
                {open && (
                    <SidebarFields
                        data={data}
                        onChange={onChange}
                        warnings={warnings}
                        onBrowseCover={() => setPickerOpen(true)}
                    />
                )}
            </AnimatePresence>

        </motion.div>

        {pickerOpen && (
            <ContentFilePicker
                token={getToken?.()}
                accept="image"
                onSelect={(url, item) => {
                    onChange({ coverImage: url, coverImageId: item.content_piece_id })
                    setPickerOpen(false)
                }}
                onClose={() => setPickerOpen(false)}
            />
        )}
        </>
    )
}
