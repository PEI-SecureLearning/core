import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen,
    Tag,
    AlignLeft,
    Check,
    Plus,
    Trash2,
    GripVertical,
    ListChecks,
    Text,
    ToggleLeft,
    Upload,
    X,
    Clock,
    FileText,
    PanelLeftClose,
    PanelLeftOpen,
    Image as ImageIcon,
    Eye,
    Edit3,
    Save,
    Loader2,
    AlertCircle,
    ChevronDown,
    Layers,
    Pencil,
} from 'lucide-react'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createModule, type CreateModulePayload } from '@/services/modulesApi'

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'
type BlockType    = 'text' | 'question' | 'rich_content'

interface Choice { id: string; text: string; isCorrect: boolean }
interface Question {
    id: string
    type: QuestionType
    text: string
    choices: Choice[]
    answer: string
}

// A block is one piece of content inside a section
interface TextBlock        { id: string; kind: 'text';         content: string }
type RichMediaType = 'image' | 'video' | 'audio' | 'file'
interface RichContentBlock {
    id: string
    kind: 'rich_content'
    mediaType: RichMediaType
    url: string
    caption: string
}
interface QuestionBlock    { id: string; kind: 'question';     question: Question }
type Block = TextBlock | RichContentBlock | QuestionBlock

interface Section {
    id: string
    title: string
    collapsed: boolean
    blocks: Block[]
}

interface ModuleFormData {
    title: string
    category: string
    description: string
    coverImage: string
    estimatedTime: string
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
    sections: Section[]
}

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2)

const CATEGORY_OPTIONS = [
    'Programming', 'Backend', 'Frontend', 'Security', 'DevOps', 'Data', 'Cloud', 'Other',
]

const TRUE_FALSE_CHOICES: Choice[] = [
    { id: 'tf-t', text: 'True', isCorrect: true },
    { id: 'tf-f', text: 'False', isCorrect: false },
]

function emptyQuestion(): Question {
    return {
        id: uid(),
        type: 'multiple_choice',
        text: '',
        choices: [
            { id: uid(), text: '', isCorrect: false },
            { id: uid(), text: '', isCorrect: false },
        ],
        answer: '',
    }
}

function emptySection(): Section {
    return { id: uid(), title: 'New Section', collapsed: false, blocks: [] }
}

const DIFFICULTY_COLORS = {
    Beginner:     'bg-green-100 text-green-700 border-green-300',
    Intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Advanced:     'bg-red-100 text-red-700 border-red-300',
}

function totalBlocks(d: ModuleFormData) {
    return d.sections.reduce((acc, s) => acc + s.blocks.length, 0)
}

function totalQuestions(d: ModuleFormData) {
    return d.sections.reduce((acc, s) =>
        acc + s.blocks.filter(b => b.kind === 'question').length, 0)
}

/** Compute a 0–100 completion score */
function calcCompletion(d: ModuleFormData): number {
    const checks = [
        !!d.title.trim(),
        !!d.category,
        !!d.description.trim(),
        !!d.estimatedTime.trim(),
        d.sections.length > 0,
        totalBlocks(d) > 0,
        !!d.coverImage,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

/** Markdown → HTML (headings, bold, italic, strike, inline-code, code blocks, blockquotes, tables, lists, hr, paragraphs) */
function renderMarkdown(md: string): string {
    // Escape HTML entities first
    let out = md
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')

    // Fenced code blocks ```lang\n...\n```
    out = out.replaceAll(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
        `<pre class="bg-slate-900 text-green-300 rounded-lg px-4 py-3 my-3 overflow-x-auto text-xs font-mono whitespace-pre">${
            lang ? `<span class="text-slate-500 text-[10px] uppercase block mb-1">${lang}</span>` : ''
        }${code.trim()}</pre>`)

    // Blockquotes (lines starting with >)
    out = out.replaceAll(/^&gt; (.+)$/gm,
        '<blockquote class="border-l-4 border-purple-300 pl-3 italic text-slate-500 my-2">$1</blockquote>')

    // Horizontal rule
    out = out.replaceAll(/^---$/gm,
        '<hr class="my-4 border-slate-200" />')

    // Tables: | col | col | with separator row | --- | --- |
    out = out.replaceAll(
        /^\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm,
        (_m, header, rows) => {
            const thCells = header.split('|').filter((c: string) => c.trim()).map((c: string) =>
                `<th class="px-3 py-2 text-left text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200">${c.trim()}</th>`
            ).join('')
            const bodyRows = rows.trim().split('\n').map((row: string) => {
                const tds = row.split('|').filter((c: string) => c.trim()).map((c: string) =>
                    `<td class="px-3 py-2 text-xs text-slate-700 border border-slate-200">${c.trim()}</td>`
                ).join('')
                return `<tr>${tds}</tr>`
            }).join('')
            return `<div class="overflow-x-auto my-3"><table class="w-full border-collapse text-sm"><thead><tr>${thCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`
        }
    )

    // Headings
    out = out
        .replaceAll(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-1 text-slate-800">$1</h3>')
        .replaceAll(/^## (.+)$/gm,  '<h2 class="text-lg font-bold mt-5 mb-2 text-slate-800">$1</h2>')
        .replaceAll(/^# (.+)$/gm,   '<h1 class="text-xl font-bold mt-6 mb-2 text-slate-900">$1</h1>')

    // Inline: bold, italic, strikethrough, inline-code
    out = out
        .replaceAll(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
        .replaceAll(/~~(.+?)~~/g,     '<del class="text-slate-400 line-through">$1</del>')
        .replaceAll(/_(.+?)_/g,       '<em class="italic">$1</em>')
        .replaceAll(/`([^`]+)`/g,     '<code class="bg-slate-100 text-purple-700 rounded px-1 py-0.5 text-[12px] font-mono">$1</code>')

    // Lists
    out = out
        .replaceAll(/^- (.+)$/gm,      '<li class="ml-5 list-disc text-slate-700 leading-relaxed">$1</li>')
        .replaceAll(/^\d+\. (.+)$/gm,  '<li class="ml-5 list-decimal text-slate-700 leading-relaxed">$1</li>')

    // Plain paragraphs (lines not already wrapped in an HTML tag)
    out = out.replaceAll(/^(?!<[a-zA-Z/])(.+)$/gm,
        '<p class="text-slate-700 leading-relaxed my-1">$1</p>')

    // Collapse multiple blank lines
    out = out.replaceAll(/\n{2,}/g, '\n')

    return out
}

/* ─────────────────────────────────────────────────────────
   Progress Bar
───────────────────────────────────────────────────────── */
function ProgressBar({ data }: { readonly data: ModuleFormData }) {
    const pct = calcCompletion(data)
    const [tipVisible, setTipVisible] = useState(false)
    const btnRef = useRef<HTMLButtonElement>(null)
    const [tipPos, setTipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

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

    const openTip = () => {
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            // Anchor to the right edge of the button, shift left so it doesn't overflow screen
            const popoverWidth = 180
            const left = Math.min(r.right - popoverWidth, window.innerWidth - popoverWidth - 12)
            setTipPos({ top: r.bottom + 6, left: Math.max(8, left) })
        }
        setTipVisible(true)
    }

    return (
        <>
            <div className="flex items-center gap-3 px-6 py-2 border-b border-slate-200 bg-white/60 backdrop-blur-sm">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    Completion
                </span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                        onClick={openTip}
                        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-purple-100 text-slate-500 hover:text-purple-600 text-[10px] font-bold flex items-center justify-center transition-colors flex-shrink-0"
                        aria-label="Show missing fields"
                    >
                        ?
                    </button>
                )}
            </div>

            {/* Popover — rendered outside the flex row so it doesn't affect layout */}
            <AnimatePresence>
                {tipVisible && missing.length > 0 && (
                    <>
                        <button
                            type="button"
                            aria-label="Close"
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={() => setTipVisible(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            style={{ top: tipPos.top, left: tipPos.left }}
                            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 px-4 py-3 min-w-[160px]"
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
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

/* ─────────────────────────────────────────────────────────
   Shared
───────────────────────────────────────────────────────── */
const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300/50'

function FormField({ label, icon, children }: {
    readonly label: string; readonly icon?: React.ReactNode; readonly children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {icon && <span className="text-purple-400">{icon}</span>}
                {label}
            </label>
            {children}
        </div>
    )
}

/* ─────────────────────────────────────────────────────────
   Collapsible Details Sidebar
───────────────────────────────────────────────────────── */
function DetailsSidebar({ data, onChange }: {
    readonly data: ModuleFormData
    readonly onChange: (patch: Partial<ModuleFormData>) => void
}) {
    const [open, setOpen] = useState(true)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        onChange({ coverImage: URL.createObjectURL(file) })
    }

    return (
        <motion.div
            animate={{ width: open ? 300 : 52 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 h-full flex flex-col bg-white border-r border-slate-200 overflow-hidden relative"
        >
            {/* Toggle button */}
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
                    onClick={() => setOpen(o => !o)}
                    className="ml-auto text-slate-400 hover:text-purple-600 transition-colors flex-shrink-0"
                    title={open ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {open
                        ? <PanelLeftClose className="w-4 h-4" />
                        : <PanelLeftOpen  className="w-4 h-4" />
                    }
                </button>
            </div>

            {/* Collapsed icons strip */}
            {!open && (
                <div className="flex flex-col items-center gap-4 py-4 text-slate-300">
                    <BookOpen  className="w-4 h-4" />
                    <Tag       className="w-4 h-4" />
                    <Clock     className="w-4 h-4" />
                    <AlignLeft className="w-4 h-4" />
                    <ImageIcon className="w-4 h-4" />
                </div>
            )}

            {/* Fields — only rendered when open to avoid layout bleed */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-5 px-4 py-5 overflow-y-auto flex-1"
                    >
                        {/* Cover image */}
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="relative w-full h-28 rounded-xl border-2 border-dashed border-slate-200 hover:border-purple-400 transition-colors overflow-hidden group"
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
                                    <Upload className="w-6 h-6" />
                                    <span className="text-xs">Cover image</span>
                                </div>
                            )}
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />

                        {/* Title */}
                        <FormField label="Title" icon={<BookOpen className="w-3 h-3" />}>
                            <input
                                value={data.title}
                                onChange={e => onChange({ title: e.target.value })}
                                placeholder="Module title..."
                                className="w-full bg-transparent border-b-2 border-slate-200 focus:border-purple-400 px-0 py-1.5 text-base font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none transition-colors"
                            />
                        </FormField>

                        {/* Category */}
                        <FormField label="Category" icon={<Tag className="w-3 h-3" />}>
                            <select value={data.category} onChange={e => onChange({ category: e.target.value })} className={inputCls}>
                                <option value="">Select category</option>
                                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </FormField>

                        {/* Difficulty */}
                        <FormField label="Difficulty">
                            <div className="flex gap-1.5">
                                {(['Beginner', 'Intermediate', 'Advanced'] as const).map(d => (
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

                        {/* Duration */}
                        <FormField label="Duration" icon={<Clock className="w-3 h-3" />}>
                            <input
                                value={data.estimatedTime}
                                onChange={e => onChange({ estimatedTime: e.target.value })}
                                placeholder="e.g. 45 minutes"
                                className={inputCls}
                            />
                        </FormField>

                        {/* Description */}
                        <FormField label="Description" icon={<AlignLeft className="w-3 h-3" />}>
                            <textarea
                                value={data.description}
                                onChange={e => onChange({ description: e.target.value })}
                                placeholder="Brief description..."
                                rows={4}
                                className={`${inputCls} resize-none`}
                            />
                        </FormField>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ─────────────────────────────────────────────────────────
   Markdown toolbar insert helper
───────────────────────────────────────────────────────── */
const MD_HEADING_OPTIONS = [
    { label: 'H1 — Title',    insert: '\n# Heading\n' },
    { label: 'H2 — Section',  insert: '\n## Heading\n' },
    { label: 'H3 — Subsection', insert: '\n### Heading\n' },
]
const MD_LIST_OPTIONS = [
    { label: '• Bullet list',   insert: '\n- Item\n- Item\n' },
    { label: '1. Numbered list', insert: '\n1. Item\n2. Item\n' },
]
const MD_INSERT_OPTIONS = [
    { label: '``` Code block',  insert: '\n```\ncode here\n```\n' },
    { label: '❝  Blockquote',   insert: '\n> Quoted text\n' },
    { label: '⊟  Table',        insert: '\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n' },
    { label: '─  Divider',      insert: '\n---\n' },
]
const MD_INLINE_ACTIONS = [
    { label: 'B',       insert: '**bold**',    title: 'Bold',          labelClass: 'font-bold' },
    { label: 'I',       insert: '_italic_',    title: 'Italic',        labelClass: 'italic' },
    { label: 'Strike',  insert: '~~strike~~',  title: 'Strikethrough', labelClass: 'line-through' },
    { label: 'Code',    insert: '`code`',      title: 'Inline code',   labelClass: 'font-mono' },
]

function MdDropdown({ label, options, onInsert }: {
    readonly label: string
    readonly options: { label: string; insert: string }[]
    readonly onInsert: (insert: string) => void
}) {
    const [open, setOpen] = useState(false)
    const btnRef = useRef<HTMLButtonElement>(null)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

    const handleOpen = () => {
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            setPos({ top: r.bottom + 4, left: r.left })
        }
        setOpen(o => !o)
    }

    return (
        <div>
            <button ref={btnRef} type="button" onClick={handleOpen}
                className="flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium rounded bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 transition-colors text-slate-900">
                {label}
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>
            <AnimatePresence>
                {open && pos && (
                    <>
                        <button
                            type="button"
                            aria-label="Close"
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.1 }}
                            style={{ top: pos.top, left: pos.left }}
                            className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden min-w-[120px]"
                        >
                            {options.map(opt => (
                                <button key={opt.label} type="button"
                                    onClick={() => { onInsert(opt.insert); setOpen(false) }}
                                    className="w-full px-3 py-2 text-left text-[12px] font-medium text-slate-800 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                                    {opt.label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────
   Text block editor (Markdown)
───────────────────────────────────────────────────────── */
function MarkdownBlockEditor({ block, onUpdate, onRemove }: {
    readonly block: TextBlock
    readonly onUpdate: (content: string) => void
    readonly onRemove: () => void
}) {
    const [mode, setMode] = useState<'edit' | 'preview'>('edit')

    return (
        <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white">
            {/* Block toolbar */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-1 bg-blue-50 text-blue-500">
                    Text
                </span>
                {mode === 'edit' && (
                    <>
                        <MdDropdown label="Heading" options={MD_HEADING_OPTIONS} onInsert={s => onUpdate(block.content + s)} />
                        {MD_INLINE_ACTIONS.map(({ label, insert, title, labelClass }) => (
                            <button key={label} type="button" title={title}
                                onClick={() => onUpdate(block.content + insert)}
                                className="px-2 py-0.5 text-[11px] font-medium rounded bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 transition-colors text-slate-900">
                                <span className={labelClass}>{label}</span>
                            </button>
                        ))}
                        <MdDropdown label="List"   options={MD_LIST_OPTIONS}   onInsert={s => onUpdate(block.content + s)} />
                        <MdDropdown label="Insert" options={MD_INSERT_OPTIONS} onInsert={s => onUpdate(block.content + s)} />
                    </>
                )}
                <div className="ml-auto flex items-center gap-1">
                    {mode === 'edit' && (
                        <span className="text-[10px] text-slate-400">{block.content.length} chars</span>
                    )}
                    <div className="flex rounded-md border border-slate-200 overflow-hidden">
                        <button type="button" onClick={() => setMode('edit')}
                            className={`flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium transition-colors
                                ${mode === 'edit' ? 'bg-purple-600 text-white' : 'bg-white text-slate-400 hover:text-purple-600'}`}>
                            <Edit3 className="w-2.5 h-2.5" /> Edit
                        </button>
                        <button type="button" onClick={() => setMode('preview')}
                            className={`flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium transition-colors
                                ${mode === 'preview' ? 'bg-purple-600 text-white' : 'bg-white text-slate-400 hover:text-purple-600'}`}>
                            <Eye className="w-2.5 h-2.5" /> Preview
                        </button>
                    </div>
                    <button type="button" onClick={onRemove}
                        className="ml-1 text-slate-300 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            <AnimatePresence mode="wait">
                {mode === 'edit' ? (
                    <motion.textarea key="edit"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        value={block.content}
                        onChange={e => onUpdate(e.target.value)}
                        placeholder="Write text with Markdown..."
                        rows={5}
                        className="font-mono text-sm px-4 py-3 focus:outline-none resize-y bg-white text-slate-900 placeholder:text-slate-400 min-h-[80px] border-0"
                    />
                ) : (
                    <motion.div key="preview"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="px-5 py-4 text-sm min-h-[80px]"
                    >
                        {block.content.trim()
                            ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content) }} />
                            : <p className="text-slate-300 italic">Nothing to preview yet.</p>
                        }
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────
   Rich content block editor (image / video / audio / file)
───────────────────────────────────────────────────────── */
const RICH_MEDIA_OPTIONS: { type: RichMediaType; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { type: 'image', label: 'Image',  icon: <ImageIcon className="w-3.5 h-3.5" />, placeholder: 'https://…/image.png or backend asset URL' },
    { type: 'video', label: 'Video',  icon: <Eye       className="w-3.5 h-3.5" />, placeholder: 'https://…/video.mp4 or YouTube embed URL' },
    { type: 'audio', label: 'Audio',  icon: <Clock     className="w-3.5 h-3.5" />, placeholder: 'https://…/audio.mp3 or backend asset URL' },
    { type: 'file',  label: 'File',   icon: <FileText  className="w-3.5 h-3.5" />, placeholder: 'https://…/document.pdf or backend asset URL' },
]

function RichContentBlockEditor({ block, onUpdate, onRemove }: {
    readonly block: RichContentBlock
    readonly onUpdate: (patch: Partial<RichContentBlock>) => void
    readonly onRemove: () => void
}) {
    const meta = RICH_MEDIA_OPTIONS.find(o => o.type === block.mediaType) ?? RICH_MEDIA_OPTIONS[0]

    return (
        <div className="flex flex-col border border-violet-200 rounded-xl overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 border-b border-violet-100">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-1 bg-violet-100 text-violet-600">
                    Media
                </span>
                {/* Media type tabs */}
                <div className="flex gap-1">
                    {RICH_MEDIA_OPTIONS.map(o => (
                        <button
                            key={o.type}
                            type="button"
                            onClick={() => onUpdate({ mediaType: o.type })}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                                block.mediaType === o.type
                                    ? 'bg-violet-600 text-white border-violet-600'
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                            }`}
                        >
                            {o.icon}
                            {o.label}
                        </button>
                    ))}
                </div>
                <button type="button" onClick={onRemove}
                    className="ml-auto text-slate-300 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex flex-col gap-2.5 px-4 py-3">
                {/* URL input */}
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        {meta.label} URL
                    </label>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-violet-300/50 focus-within:border-violet-300">
                        <span className="text-slate-400 flex-shrink-0">{meta.icon}</span>
                        <input
                            type="url"
                            value={block.url}
                            onChange={e => onUpdate({ url: e.target.value })}
                            placeholder={meta.placeholder}
                            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none min-w-0"
                        />
                        {block.url && (
                            <button type="button" onClick={() => onUpdate({ url: '' })}
                                className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Caption */}
                <input
                    type="text"
                    value={block.caption}
                    onChange={e => onUpdate({ caption: e.target.value })}
                    placeholder="Caption (optional)…"
                    className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300/50 text-slate-700 placeholder:text-slate-400"
                />

                {/* Inline preview */}
                {block.url && (
                    <div className="rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                        {block.mediaType === 'image' && (
                            <img src={block.url} alt={block.caption || 'preview'}
                                className="max-h-48 w-full object-contain" />
                        )}
                        {block.mediaType === 'video' && (
                            <video src={block.url} controls className="w-full max-h-48">
                                <track kind="captions" />
                            </video>
                        )}
                        {block.mediaType === 'audio' && (
                            <audio src={block.url} controls className="w-full px-3 py-2">
                                <track kind="captions" />
                            </audio>
                        )}
                        {block.mediaType === 'file' && (
                            <a href={block.url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-3 text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors">
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{block.url}</span>
                            </a>
                        )}
                        {block.caption && (
                            <p className="text-[11px] text-slate-500 text-center px-3 py-1.5 border-t border-slate-100 italic">
                                {block.caption}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────
   Question block editor
───────────────────────────────────────────────────────── */
const QUESTION_TYPE_META: Record<QuestionType, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
    multiple_choice: { label: 'Multiple Choice', Icon: ListChecks },
    true_false:      { label: 'True / False',    Icon: ToggleLeft },
    short_answer:    { label: 'Short Answer',    Icon: Text },
}

function QuestionBlockEditor({ block, onUpdate, onRemove }: {
    readonly block: QuestionBlock
    readonly onUpdate: (q: Question) => void
    readonly onRemove: () => void
}) {
    const q = block.question
    const addChoice    = () => onUpdate({ ...q, choices: [...q.choices, { id: uid(), text: '', isCorrect: false }] })
    const removeChoice = (id: string) => onUpdate({ ...q, choices: q.choices.filter(c => c.id !== id) })
    const patchChoice  = (id: string, patch: Partial<Choice>) =>
        onUpdate({ ...q, choices: q.choices.map(c => c.id === id ? { ...c, ...patch } : c) })
    const setCorrect   = (id: string) =>
        onUpdate({ ...q, choices: q.choices.map(c => ({ ...c, isCorrect: c.id === id })) })

    const choices = q.type === 'true_false' ? TRUE_FALSE_CHOICES : q.choices

    return (
        <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 mr-2">
                    Question
                </span>
                <div className="flex gap-1">
                    {(Object.entries(QUESTION_TYPE_META) as [QuestionType, typeof QUESTION_TYPE_META[QuestionType]][]).map(([type, meta]) => (
                        <button key={type} type="button"
                            onClick={() => onUpdate({ ...q, type, choices: type === 'multiple_choice' ? q.choices : [] })}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all
                                ${q.type === type ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-400 border-slate-200 hover:border-purple-300'}`}>
                            <meta.Icon className="w-3 h-3" />
                            <span className="hidden sm:inline">{meta.label}</span>
                        </button>
                    ))}
                </div>
                <button type="button" onClick={onRemove} className="ml-auto text-slate-300 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="px-4 pt-3 pb-2">
                <input value={q.text} onChange={e => onUpdate({ ...q, text: e.target.value })}
                    placeholder="Type your question here..."
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300/50 text-slate-700 placeholder:text-slate-400" />
            </div>
            <div className="px-4 pb-4 flex flex-col gap-2">
                {q.type === 'short_answer' ? (
                    <input value={q.answer} onChange={e => onUpdate({ ...q, answer: e.target.value })}
                        placeholder="Expected answer (optional)..."
                        className="w-full text-sm bg-slate-50 border border-dashed border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300/50 text-slate-700 placeholder:text-slate-400 italic" />
                ) : (
                    <>
                        {choices.map((choice, ci) => (
                            <div key={choice.id} className="flex items-center gap-2">
                                <button type="button"
                                    onClick={() => q.type !== 'true_false' && setCorrect(choice.id)}
                                    title="Mark as correct"
                                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center
                                        ${choice.isCorrect ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'}`}>
                                    {choice.isCorrect && <Check className="w-3 h-3 text-white" />}
                                </button>
                                {q.type === 'true_false' ? (
                                    <span className="flex-1 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">{choice.text}</span>
                                ) : (
                                    <input value={choice.text} onChange={e => patchChoice(choice.id, { text: e.target.value })}
                                        placeholder={`Option ${ci + 1}`}
                                        className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300/50 text-slate-700 placeholder:text-slate-400" />
                                )}
                                {q.type === 'multiple_choice' && (
                                    <button type="button" onClick={() => removeChoice(choice.id)}
                                        className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {q.type === 'multiple_choice' && (
                            <button type="button" onClick={addChoice}
                                className="flex items-center gap-1 mt-1 text-xs text-purple-500 hover:text-purple-700 transition-colors self-start">
                                <Plus className="w-3 h-3" /> Add option
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────
   Add-block menu
───────────────────────────────────────────────────────── */
function AddBlockMenu({ onAdd }: { readonly onAdd: (kind: BlockType) => void }) {
    const [open, setOpen] = useState(false)
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
    const btnRef = useRef<HTMLButtonElement>(null)

    const handleOpen = () => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setMenuPos({ top: rect.bottom + 6, left: rect.left })
        }
        setOpen(o => !o)
    }

    const options: { kind: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
        { kind: 'text',         label: 'Text',         icon: <FileText   className="w-4 h-4" />, desc: 'Plain or Markdown text' },
        { kind: 'rich_content', label: 'Media',        icon: <ImageIcon  className="w-4 h-4" />, desc: 'Image, video, audio or file' },
        { kind: 'question',     label: 'Question',     icon: <ListChecks className="w-4 h-4" />, desc: 'Multiple choice, T/F, or short answer' },
    ]
    return (
        <div>
            <button ref={btnRef} type="button" onClick={handleOpen}
                className="flex items-center gap-1.5 text-xs font-medium text-purple-500 hover:text-purple-700 transition-colors py-1">
                <Plus className="w-3.5 h-3.5" /> Add block
            </button>
            <AnimatePresence>
                {open && menuPos && (
                    <>
                        <button
                            type="button"
                            aria-label="Close"
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            style={{ top: menuPos.top, left: menuPos.left }}
                            className="fixed z-50 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/80 overflow-hidden min-w-[220px]"
                        >
                            {options.map(opt => (
                                <button key={opt.kind} type="button"
                                    onClick={() => { onAdd(opt.kind); setOpen(false) }}
                                    className="flex items-start gap-3 w-full px-4 py-3 hover:bg-purple-50 transition-colors text-left">
                                    <span className="text-purple-500 mt-0.5">{opt.icon}</span>
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

/* ─────────────────────────────────────────────────────────
   Sortable block wrapper
───────────────────────────────────────────────────────── */
function SortableBlock({ id, children }: { readonly id: string; readonly children: React.ReactNode }) {
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

/* ─────────────────────────────────────────────────────────
   Section card
───────────────────────────────────────────────────────── */
function SectionCard({ section, index, onUpdate, onRemove }: {
    readonly section: Section
    readonly index: number
    readonly onUpdate: (patch: Partial<Section>) => void
    readonly onRemove: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
    }

    const [editingTitle, setEditingTitle] = useState(false)
    const titleInputRef = useRef<HTMLInputElement>(null)

    const startEdit = () => {
        setEditingTitle(true)
        setTimeout(() => titleInputRef.current?.focus(), 0)
    }

    const patchBlock = (blockId: string, newBlock: Block) =>
        onUpdate({ blocks: section.blocks.map(b => b.id === blockId ? newBlock : b) })

    const removeBlock = (blockId: string) =>
        onUpdate({ blocks: section.blocks.filter(b => b.id !== blockId) })

    const renderBlock = (block: Block) => {
        if (block.kind === 'question') {
            return (
                <QuestionBlockEditor
                    block={block}
                    onUpdate={q => patchBlock(block.id, { ...block, question: q })}
                    onRemove={() => removeBlock(block.id)}
                />
            )
        }
        if (block.kind === 'rich_content') {
            return (
                <RichContentBlockEditor
                    block={block}
                    onUpdate={patch => patchBlock(block.id, { ...block, ...patch })}
                    onRemove={() => removeBlock(block.id)}
                />
            )
        }
        return (
            <MarkdownBlockEditor
                block={block}
                onUpdate={content => patchBlock(block.id, { ...block, content })}
                onRemove={() => removeBlock(block.id)}
            />
        )
    }

    const addBlock = (kind: BlockType) => {
        let newBlock: Block
        if (kind === 'question') {
            newBlock = { id: uid(), kind: 'question', question: emptyQuestion() }
        } else if (kind === 'rich_content') {
            newBlock = { id: uid(), kind: 'rich_content', mediaType: 'image', url: '', caption: '' }
        } else {
            newBlock = { id: uid(), kind: 'text', content: '' }
        }
        onUpdate({ blocks: [...section.blocks, newBlock] })
    }

    const handleBlockDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = section.blocks.findIndex(b => b.id === active.id)
        const newIndex = section.blocks.findIndex(b => b.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
            onUpdate({ blocks: arrayMove(section.blocks, oldIndex, newIndex) })
        }
    }

    const blockSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    return (
        <div ref={setNodeRef} style={style}
            className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                {/* Drag handle */}
                <button
                    type="button"
                    className={`cursor-grab active:cursor-grabbing text-slate-300 hover:text-purple-400 transition-colors flex-shrink-0 touch-none ${isDragging ? 'text-purple-400' : ''}`}
                    {...attributes}
                    {...listeners}
                    aria-label="Drag to reorder section"
                >
                    <GripVertical className="w-4 h-4" />
                </button>

                {/* Section number badge */}
                <span className="text-[11px] font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 flex-shrink-0 tabular-nums">
                    {index + 1}
                </span>

                {/* Editable title */}
                {editingTitle ? (
                    <input
                        ref={titleInputRef}
                        value={section.title}
                        onChange={e => onUpdate({ title: e.target.value })}
                        onBlur={() => setEditingTitle(false)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false) }}
                        placeholder="Section title..."
                        className="flex-1 text-sm font-semibold text-slate-800 bg-white border border-purple-300 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-purple-300/40 min-w-0"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={startEdit}
                        className="flex-1 flex items-center gap-1.5 min-w-0 group text-left"
                    >
                        <span className={`text-sm font-semibold truncate ${section.title ? 'text-slate-800' : 'text-slate-400'}`}>
                            {section.title || 'Untitled section'}
                        </span>
                        <Pencil className="w-3 h-3 text-slate-300 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                    </button>
                )}

                {/* Block count */}
                {section.blocks.length > 0 && (
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {section.blocks.length} {section.blocks.length === 1 ? 'block' : 'blocks'}
                    </span>
                )}

                {/* Collapse */}
                <button type="button" onClick={() => onUpdate({ collapsed: !section.collapsed })}
                    className="text-slate-400 hover:text-purple-600 transition-colors flex-shrink-0">
                    <motion.div animate={{ rotate: section.collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </button>

                {/* Delete section */}
                <button type="button" onClick={onRemove}
                    className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Blocks */}
            <AnimatePresence>
                {!section.collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-3 p-4">
                            <DndContext
                                sensors={blockSensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleBlockDragEnd}
                            >
                                <SortableContext
                                    items={section.blocks.map(b => b.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="flex flex-col gap-3">
                                        {section.blocks.map(block => (
                                            <SortableBlock key={block.id} id={block.id}>
                                                {renderBlock(block)}
                                            </SortableBlock>
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            {/* Add block */}
                            <div className="pt-1 pl-6">
                                <AddBlockMenu onAdd={addBlock} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────
   Sections editor (replaces MainArea / ContentEditor / QuestionsPanel)
───────────────────────────────────────────────────────── */
function SectionsEditor({ data, onChange }: {
    readonly data: ModuleFormData
    readonly onChange: (patch: Partial<ModuleFormData>) => void
}) {
    const addSection = () => onChange({ sections: [...data.sections, emptySection()] })

    const updateSection = (id: string, patch: Partial<Section>) =>
        onChange({ sections: data.sections.map(s => s.id === id ? { ...s, ...patch } : s) })

    const removeSection = (id: string) =>
        onChange({ sections: data.sections.filter(s => s.id !== id) })

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = data.sections.findIndex(s => s.id === active.id)
        const newIndex = data.sections.findIndex(s => s.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
            onChange({ sections: arrayMove(data.sections, oldIndex, newIndex) })
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-semibold uppercase tracking-wide">Sections</span>
                    <span className="bg-purple-50 text-purple-600 border border-purple-200 rounded-full px-2 py-0.5 font-bold">
                        {data.sections.length}
                    </span>
                    {totalQuestions(data) > 0 && (
                        <span className="bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                            {totalQuestions(data)} {totalQuestions(data) === 1 ? 'question' : 'questions'}
                        </span>
                    )}
                </div>
                <button type="button" onClick={addSection}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200">
                    <Plus className="w-3.5 h-3.5" /> Add Section
                </button>
            </div>

            {/* Section list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={data.sections.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <AnimatePresence initial={false}>
                            {data.sections.map((section, i) => (
                                <SectionCard
                                    key={section.id}
                                    section={section}
                                    index={i}
                                    onUpdate={patch => updateSection(section.id, patch)}
                                    onRemove={() => removeSection(section.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </SortableContext>
                </DndContext>

                {data.sections.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                        <Layers className="w-10 h-10 text-slate-200" />
                        <p className="text-sm font-medium">No sections yet</p>
                        <p className="text-xs text-slate-300">Add a section to start building your module</p>
                        <button type="button" onClick={addSection}
                            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200">
                            <Plus className="w-4 h-4" /> Add First Section
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────
   Module Preview panel
───────────────────────────────────────────────────────── */
function PreviewBlock({ block, qIndex, answeredChoices, onMark }: {
    readonly block: Block
    readonly qIndex: number
    readonly answeredChoices: Record<string, string>
    readonly onMark: (qid: string, cid: string) => void
}) {
    if (block.kind === 'text') {
        return (
            <div
                className="text-[15px] leading-7 text-slate-700 [&_h1]:text-slate-900 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-slate-800 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-slate-800 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_strong]:text-slate-900 [&_strong]:font-semibold [&_em]:text-slate-600 [&_a]:text-purple-600 [&_a]:underline [&_code]:bg-slate-100 [&_code]:text-purple-700 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono [&_pre]:bg-slate-900 [&_pre]:rounded-xl [&_pre]:text-green-300 [&_pre]:my-4 [&_li]:text-slate-700 [&_li]:leading-7 [&_blockquote]:border-purple-400 [&_blockquote]:text-slate-500 [&_blockquote]:bg-purple-50/40 [&_blockquote]:py-1 [&_hr]:border-slate-200 [&_del]:text-slate-400 [&_table]:w-full [&_th]:bg-slate-50 [&_th]:text-slate-700 [&_th]:border-slate-200 [&_td]:text-slate-700 [&_td]:border-slate-200"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content || '') }}
            />
        )
    }

    if (block.kind === 'rich_content') {
        const renderMedia = () => {
            if (!block.url) {
                return (
                    <div className="flex items-center justify-center h-24 text-slate-400 gap-2 text-sm italic">
                        <ImageIcon className="w-5 h-5" />
                        No media URL set
                    </div>
                )
            }
            if (block.mediaType === 'image') {
                return <img src={block.url} alt={block.caption || 'media'} className="w-full max-h-80 object-contain" />
            }
            if (block.mediaType === 'video') {
                return (
                    <video src={block.url} controls className="w-full max-h-80">
                        <track kind="captions" />
                    </video>
                )
            }
            if (block.mediaType === 'audio') {
                return (
                    <audio src={block.url} controls className="w-full px-4 py-3">
                        <track kind="captions" />
                    </audio>
                )
            }
            return (
                <a href={block.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-purple-600 font-medium hover:text-purple-800 transition-colors">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{block.url}</span>
                </a>
            )
        }
        return (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {renderMedia()}
                {block.caption && (
                    <p className="text-[11px] text-slate-500 text-center px-3 py-2 border-t border-slate-200 italic">
                        {block.caption}
                    </p>
                )}
            </div>
        )
    }

    if (block.kind === 'question') {
        const q = block.question
        const answered = answeredChoices[q.id]
        let typeLabel = 'Short Answer'
        if (q.type === 'multiple_choice') typeLabel = 'Multiple Choice'
        else if (q.type === 'true_false')  typeLabel = 'True / False'
        const choices = q.type === 'true_false'
            ? [{ id: 'tf-t', text: 'True', isCorrect: true }, { id: 'tf-f', text: 'False', isCorrect: false }]
            : q.choices

        const choiceBtnClass = (c: Choice) => {
            const isSelected = answered === c.id
            if (!isSelected) return 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50/50 hover:border-purple-200'
            if (c.isCorrect)  return 'bg-green-50 border-green-400 text-green-800'
            return 'bg-red-50 border-red-400 text-red-800'
        }
        const choiceCircleClass = (c: Choice) => {
            const isSelected = answered === c.id
            if (!isSelected) return 'border-slate-300'
            if (c.isCorrect)  return 'border-green-500 bg-green-100'
            return 'border-red-500 bg-red-100'
        }

        return (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <ListChecks className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500">{typeLabel}</span>
                    <span className="ml-auto text-[10px] text-slate-400">Q{qIndex}</span>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed mb-4">
                        {q.text || <em className="text-slate-400 font-normal">No question text</em>}
                    </p>
                    {q.type === 'short_answer' ? (
                        <div className="flex gap-2">
                            <input type="text" placeholder="Your answer…"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300" />
                            <button type="button"
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                Check
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {choices.map(c => {
                                const isSelected = answered === c.id
                                return (
                                    <button key={c.id} type="button"
                                        onClick={() => onMark(q.id, c.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-all ${choiceBtnClass(c)}`}>
                                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${choiceCircleClass(c)}`}>
                                            {isSelected && c.isCorrect  && <Check className="w-2.5 h-2.5 text-green-600" />}
                                            {isSelected && !c.isCorrect && <X     className="w-2.5 h-2.5 text-red-600" />}
                                        </span>
                                        <span className="flex-1">{c.text || <em className="text-slate-400">Empty choice</em>}</span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        )
    }
    return null
}

function ModulePreview({ data, onClose }: { readonly data: ModuleFormData; readonly onClose: () => void }) {
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
    const [answeredChoices, setAnsweredChoices]     = useState<Record<string, string>>({})
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

    const toggleSection = (id: string) =>
        setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }))

    const scrollTo = (id: string) => {
        const el = sectionRefs.current[id]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Ensure section is expanded
        setCollapsedSections(prev => ({ ...prev, [id]: false }))
    }

    const onMark = (qid: string, cid: string) =>
        setAnsweredChoices(prev => ({ ...prev, [qid]: cid }))

    // Per-section question counter (cumulative index)
    let globalQIndex = 0

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-white/10 backdrop-blur-xl flex flex-col"
        >
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-800 truncate">
                        {data.title || <span className="italic text-slate-400">Untitled Module</span>}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {data.difficulty && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${DIFFICULTY_COLORS[data.difficulty]}`}>
                                {data.difficulty}
                            </span>
                        )}
                        {data.category && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                                {data.category}
                            </span>
                        )}
                        {data.estimatedTime && (
                            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                                <Clock className="w-3 h-3" />
                                {data.estimatedTime}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-slate-400 hidden sm:block italic">Preview</span>
                    <button type="button" onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold transition-colors">
                        <X className="w-3.5 h-3.5" />
                        Close
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden bg-slate-50">

                {/* ── Left sidebar ── */}
                <div className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
                    {/* Cover */}
                    <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
                        {data.coverImage ? (
                            <img src={data.coverImage} alt="cover"
                                className="w-full h-20 object-cover rounded-lg" />
                        ) : (
                            <div className="w-full h-20 rounded-lg bg-gradient-to-br from-purple-100 to-slate-100 flex items-center justify-center">
                                <BookOpen className="w-7 h-7 text-purple-300" />
                            </div>
                        )}
                        {data.description && (
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-2 line-clamp-2">
                                {data.description}
                            </p>
                        )}
                    </div>

                    {/* Task list */}
                    <div className="flex-1 overflow-y-auto py-2">
                        <p className="px-4 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Tasks
                        </p>
                        {data.sections.length === 0
                            ? <p className="px-4 py-3 text-xs text-slate-400 italic">No tasks yet</p>
                            : data.sections.map((sec, i) => {
                                const qCount = sec.blocks.filter(b => b.kind === 'question').length
                                const isCollapsed = collapsedSections[sec.id]
                                return (
                                    <button key={sec.id} type="button"
                                        onClick={() => scrollTo(sec.id)}
                                        className="w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-slate-50 transition-colors group border-l-2 border-transparent hover:border-purple-300">
                                        <span className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                            isCollapsed
                                                ? 'bg-slate-100 text-slate-400'
                                                : 'bg-purple-600 text-white'
                                        }`}>
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 group-hover:text-purple-700 truncate transition-colors">
                                                {sec.title || `Task ${i + 1}`}
                                            </p>
                                            {qCount > 0 && (
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {qCount} {qCount === 1 ? 'question' : 'questions'}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                    </div>
                </div>

                {/* ── Main scrollable content ── */}
                <div className="flex-1 overflow-y-auto">
                    {data.sections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                            <Layers className="w-10 h-10 text-slate-200" />
                            <p className="text-sm font-medium">No sections to preview</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto px-8 py-8 flex flex-col gap-4">
                            {data.sections.map((sec, i) => {
                                const isCollapsed = !!collapsedSections[sec.id]
                                const sectionQBlocks = sec.blocks.filter(b => b.kind === 'question')
                                const qCount = sectionQBlocks.length
                                // Compute base q index for this section
                                const baseQIndex = globalQIndex
                                globalQIndex += qCount

                                return (
                                    <div
                                        key={sec.id}
                                        ref={el => { sectionRefs.current[sec.id] = el }}
                                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-4"
                                    >
                                        {/* Section header — click to collapse */}
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(sec.id)}
                                            className="w-full flex items-center gap-3 px-6 py-4 bg-white hover:bg-slate-50 transition-colors text-left group"
                                        >
                                            <span className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-bold text-slate-800 group-hover:text-purple-700 transition-colors truncate">
                                                    {sec.title || `Task ${i + 1}`}
                                                </p>
                                                {qCount > 0 && (
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        {qCount} {qCount === 1 ? 'question' : 'questions'}
                                                    </p>
                                                )}
                                            </div>
                                            <motion.div
                                                animate={{ rotate: isCollapsed ? -90 : 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-slate-400 group-hover:text-purple-500 flex-shrink-0"
                                            >
                                                <ChevronDown className="w-5 h-5" />
                                            </motion.div>
                                        </button>

                                        {/* Section body */}
                                        <AnimatePresence initial={false}>
                                            {!isCollapsed && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-6 pb-6 pt-1 flex flex-col gap-5 border-t border-slate-100">
                                                        {sec.blocks.length === 0 ? (
                                                            <p className="text-sm text-slate-400 italic py-3">
                                                                No content in this task yet.
                                                            </p>
                                                        ) : (() => {
                                                            let localQ = baseQIndex
                                                            return sec.blocks.map(block => {
                                                                if (block.kind === 'question') localQ++
                                                                return (
                                                                    <PreviewBlock
                                                                        key={block.id}
                                                                        block={block}
                                                                        qIndex={block.kind === 'question' ? localQ : 0}
                                                                        answeredChoices={answeredChoices}
                                                                        onMark={onMark}
                                                                    />
                                                                )
                                                            })
                                                        })()}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

/* ─────────────────────────────────────────────────────────
   Root
───────────────────────────────────────────────────────── */
const INITIAL_DATA: ModuleFormData = {
    title: '',
    category: '',
    description: '',
    coverImage: '',
    estimatedTime: '',
    difficulty: 'Beginner',
    sections: [],
}

interface ModuleCreationFormProps {
    token?: string
    onSuccess?: (moduleId: number) => void
}

export function ModuleCreationForm({ token, onSuccess }: Readonly<ModuleCreationFormProps>) {
    const [data, setData] = useState<ModuleFormData>(INITIAL_DATA)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [draftSaved, setDraftSaved] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)

    const patch = (p: Partial<ModuleFormData>) => {
        setData(d => ({ ...d, ...p }))
        setErrorMsg(null)
    }

    const mapChoice = (c: Choice) => ({ id: c.id, text: c.text, is_correct: c.isCorrect })
    const mapQuestion = (b: QuestionBlock) => ({
        id: b.question.id,
        type: b.question.type,
        text: b.question.text,
        choices: b.question.choices.map(mapChoice),
        answer: b.question.answer,
    })
    const isQuestionBlock = (b: Block): b is QuestionBlock => b.kind === 'question'

    const buildPayload = (): CreateModulePayload => ({
        title: data.title,
        category: data.category,
        description: data.description,
        cover_image: data.coverImage || undefined,
        estimated_time: data.estimatedTime,
        difficulty: data.difficulty,
        // Serialise sections into a JSON body string; questions are extracted flat
        body: JSON.stringify(data.sections),
        questions: data.sections.flatMap(s =>
            s.blocks.filter(isQuestionBlock).map(mapQuestion)
        ),
    })

    const handleSubmit = async () => {
        if (!data.title.trim()) {
            setErrorMsg('Please add a title before publishing.')
            return
        }
        setStatus('loading')
        setErrorMsg(null)
        try {
            const created = await createModule(buildPayload(), token)
            setStatus('success')
            onSuccess?.(created.id)
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
            setStatus('error')
        }
    }

    const handleSaveDraft = () => {
        try {
            localStorage.setItem('module_draft', JSON.stringify(data))
            setDraftSaved(true)
            setTimeout(() => setDraftSaved(false), 2000)
        } catch {
            // localStorage not available
        }
    }

    if (status === 'success') {
        return (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center h-full gap-4 bg-white">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Module Created!</h2>
                <p className="text-sm text-slate-500">"{data.title}" has been saved successfully.</p>
            </motion.div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Progress bar */}
            <ProgressBar data={data} />

            {/* Main layout */}
            <div className="flex flex-row flex-1 overflow-hidden">
                {/* Left — collapsible details sidebar */}
                <DetailsSidebar data={data} onChange={patch} />

                {/* Right — sections editor + footer */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    <SectionsEditor data={data} onChange={patch} />

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
                        {/* Status / meta */}
                        <div className="flex items-center gap-3 text-xs text-slate-400 min-w-0">
                            {errorMsg ? (
                                <span className="flex items-center gap-1 text-red-500 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    {errorMsg}
                                </span>
                            ) : (
                                <>
                                    {data.title && (
                                        <span className="font-medium text-slate-600 truncate">{data.title}</span>
                                    )}
                                    {data.difficulty && (
                                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold flex-shrink-0 ${DIFFICULTY_COLORS[data.difficulty]}`}>
                                            {data.difficulty}
                                        </span>
                                    )}
                                    {data.category && (
                                        <span className="text-slate-400 flex-shrink-0">{data.category}</span>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={status === 'loading'}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {draftSaved ? 'Saved!' : 'Save Draft'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={status === 'loading'}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Publishing…
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Publish Module
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Module preview panel */}
            <AnimatePresence>
                {previewOpen && (
                    <ModulePreview data={data} onClose={() => setPreviewOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    )
}
