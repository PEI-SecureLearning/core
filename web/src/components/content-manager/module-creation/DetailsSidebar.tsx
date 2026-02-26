import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Upload,
    Clock,
    AlignLeft,
    PanelLeftClose,
    PanelLeftOpen,
    Image as ImageIcon,
    Eye,
    AlertTriangle,
} from 'lucide-react'
import type { ModuleFormData } from './types'
import { CATEGORY_OPTIONS, DIFFICULTY_COLORS, inputCls } from './constants'

function FormField({ label, icon, warning, children }: {
    readonly label: string
    readonly icon?: React.ReactNode
    readonly warning?: boolean
    readonly children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {icon && <span className="text-purple-400">{icon}</span>}
                {label}
                {warning && <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />}
            </label>
            {children}
        </div>
    )
}

type Warnings = { cover: boolean; title: boolean; category: boolean; duration: boolean; desc: boolean }

function SidebarFields({ data, onChange, fileRef, warnings }: {
    readonly data: ModuleFormData
    readonly onChange: (patch: Partial<ModuleFormData>) => void
    readonly fileRef: React.RefObject<HTMLInputElement | null>
    readonly warnings: Warnings
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 px-3 py-4 overflow-y-auto flex-1"
        >
            <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`relative w-full h-24 rounded-xl border-2 border-dashed transition-colors overflow-hidden group ${
                    warnings.cover
                        ? 'border-amber-300 hover:border-purple-400'
                        : 'border-slate-200 hover:border-purple-400'
                }`}
            >
                {data.coverImage ? (
                    <>
                        <img src={data.coverImage} alt="cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="w-5 h-5 text-white" />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-1.5 text-slate-400">
                        <div className="relative">
                            <Upload className="w-6 h-6" />
                            {warnings.cover && (
                                <AlertTriangle className="w-3 h-3 text-amber-400 absolute -top-1 -right-2" />
                            )}
                        </div>
                        <span className="text-xs">Cover image</span>
                    </div>
                )}
            </button>

            <FormField label="Title" warning={warnings.title}>
                <input
                    value={data.title}
                    onChange={e => onChange({ title: e.target.value })}
                    placeholder="Module title..."
                    className={`w-full bg-transparent border-b-2 px-0 py-1.5 text-base font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none transition-colors ${
                        warnings.title
                            ? 'border-amber-300 focus:border-purple-400'
                            : 'border-slate-200 focus:border-purple-400'
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
                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'}`}>
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

export function DetailsSidebar({ data, onChange, onPreview, publishAttempted }: {
    readonly data: ModuleFormData
    readonly onChange: (patch: Partial<ModuleFormData>) => void
    readonly onPreview: () => void
    readonly publishAttempted?: boolean
}) {
    const [open, setOpen] = useState(true)
    const fileRef = useRef<HTMLInputElement>(null)

    const w = publishAttempted ?? false
    const warnings: Warnings = {
        cover:    w && !data.coverImage,
        title:    w && data.title.trim() === '',
        category: w && data.category === '',
        duration: w && data.estimatedTime.trim() === '',
        desc:     w && data.description.trim() === '',
    }

    const handleImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        onChange({ coverImage: URL.createObjectURL(file) })
    }, [onChange])

    const toggleOpen = useCallback(() => setOpen(o => !o), [])

    return (
        <motion.div
            animate={{ width: open ? 240 : 52 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 h-full flex flex-col bg-white border-r border-slate-200 overflow-hidden relative"
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
                            Module Details
                        </motion.span>
                    )}
                </AnimatePresence>
                <button
                    type="button"
                    onClick={toggleOpen}
                    className="ml-auto text-slate-400 hover:text-purple-600 transition-colors flex-shrink-0"
                    title={open ? 'Collapse sidebar' : 'Expand sidebar'}
                    aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
                    aria-expanded={open}
                >
                    {open
                        ? <PanelLeftClose className="w-4 h-4" />
                        : <PanelLeftOpen  className="w-4 h-4" />
                    }
                </button>
            </div>

            {!open && (
                <div className="flex flex-col items-center gap-4 py-4 text-slate-300 flex-1">
                    <ImageIcon className="w-4 h-4" />
                    <Clock     className="w-4 h-4" />
                    <AlignLeft className="w-4 h-4" />
                </div>
            )}

            <AnimatePresence>
                {open && (
                    <SidebarFields
                        data={data}
                        onChange={onChange}
                        fileRef={fileRef}
                        warnings={warnings}
                    />
                )}
            </AnimatePresence>

            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />

            <div className="border-t border-slate-200 bg-slate-50 flex-shrink-0">
                {open ? (
                    <div className="flex flex-col gap-2 p-3">
                        <button
                            type="button"
                            onClick={onPreview}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 py-3">
                        <button
                            type="button"
                            onClick={onPreview}
                            className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Preview"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
