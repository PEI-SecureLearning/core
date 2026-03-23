import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen, Check, ChevronDown, Clock, FileText,
    Image as ImageIcon, Layers, ListChecks, RefreshCw, X,
} from 'lucide-react'
import type { Block, Choice, ModuleFormData } from '../types'
import { DIFFICULTY_COLORS } from '../constants'
import { renderMarkdown } from '../utils'
import { ViewTabToggle } from '../sections/ViewTabToggle'

/* ── Preview block (light-theme renderer) ── */

const QUESTION_TYPE_LABELS: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    true_false:      'True / False',
    short_answer:    'Short Answer',
}

const TF_CHOICES: Choice[] = [
    { id: 'tf-t', text: 'True',  isCorrect: true  },
    { id: 'tf-f', text: 'False', isCorrect: false },
]

function RichMediaPreview({ block }: { readonly block: Extract<Block, { kind: 'rich_content' }> }) {
    if (!block.url) {
        return (
            <div className="flex items-center justify-center h-24 text-muted-foreground gap-2 text-sm italic">
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
            <video
                src={block.url}
                controls
                className="block max-w-full max-h-[700px] mx-auto rounded-lg shadow-sm ring-1 ring-border/20"
            >
                <track kind="captions" />
                Your browser does not support the video tag.
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
            className="flex items-center gap-2 px-4 py-3 text-sm text-accent-secondary font-medium hover:text-accent-secondary/90 transition-colors">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{block.url}</span>
        </a>
    )
}

function QuestionPreview({ block, qIndex, accent, answeredChoices, onMark }: {
    readonly block: Extract<Block, { kind: 'question' }>
    readonly qIndex: number
    readonly accent: 'purple' | 'teal'
    readonly answeredChoices: Record<string, string>
    readonly onMark: (qid: string, cid: string) => void
}) {
    const q        = block.question
    const answered = answeredChoices[q.id]
    const typeLabel = QUESTION_TYPE_LABELS[q.type] ?? 'Question'
    const choices   = q.type === 'true_false' ? TF_CHOICES : q.choices

    const choiceBtnClass = (c: Choice) => {
        if (answered !== c.id) {
            return `bg-surface border-border text-foreground ${accent === 'teal' ? 'hover:bg-accent-secondary/10 hover:border-accent-secondary/30' : 'hover:bg-primary/10 hover:border-primary/30'}`
        }
        return c.isCorrect ? 'bg-success/10 border-success/40 text-success' : 'bg-error/10 border-error/40 text-error'
    }

    const choiceCircleClass = (c: Choice) => {
        if (answered !== c.id) return 'border-border'
        return c.isCorrect ? 'border-success bg-success/20' : 'border-error bg-error/20'
    }

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-subtle border-b border-border">
                <ListChecks className={`w-3.5 h-3.5 flex-shrink-0 ${accent === 'teal' ? 'text-accent-secondary' : 'text-primary'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${accent === 'teal' ? 'text-accent-secondary' : 'text-primary'}`}>{typeLabel}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">Q{qIndex}</span>
            </div>
            <div className="px-5 py-4">
                <p className="text-sm font-semibold text-foreground leading-relaxed mb-4">
                    {q.text || <em className="text-muted-foreground font-normal">No question text</em>}
                </p>
                {q.type === 'short_answer' ? (
                    <div className="flex gap-2">
                        <input type="text" placeholder="Your answer…"
                            className={`flex-1 bg-surface-subtle border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${accent === 'teal' ? 'focus:ring-accent-secondary/50 focus:border-accent-secondary' : 'focus:ring-primary/40 focus:border-primary/50'}`} />
                        <button type="button"
                            className={`px-4 py-2 text-primary-foreground text-sm font-semibold rounded-lg transition-colors ${accent === 'teal' ? 'bg-accent-secondary hover:bg-accent-secondary/90' : 'bg-primary hover:bg-primary/90'}`}>
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
                                        {isSelected && c.isCorrect  && <Check className="w-2.5 h-2.5 text-success" />}
                                        {isSelected && !c.isCorrect && <X     className="w-2.5 h-2.5 text-error"   />}
                                    </span>
                                    <span className="flex-1">{c.text || <em className="text-muted-foreground">Empty choice</em>}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

function PreviewBlock({ block, qIndex, accent, answeredChoices, onMark }: {
    readonly block: Block
    readonly qIndex: number
    readonly accent: 'purple' | 'teal'
    readonly answeredChoices: Record<string, string>
    readonly onMark: (qid: string, cid: string) => void
}) {
    if (block.kind === 'text') {
        return (
            <div
                className="text-[15px] leading-7 text-foreground [&_h1]:text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_strong]:text-foreground [&_strong]:font-semibold [&_em]:text-muted-foreground [&_a]:text-accent-secondary [&_a]:underline [&_code]:bg-surface [&_code]:text-accent-secondary [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono [&_pre]:bg-slate-900 [&_pre]:rounded-xl [&_pre]:text-success [&_pre]:my-4 [&_li]:text-foreground [&_li]:leading-7 [&_blockquote]:border-primary/60 [&_blockquote]:text-muted-foreground [&_blockquote]:bg-primary/10 [&_blockquote]:py-1 [&_hr]:border-border [&_del]:text-muted-foreground [&_table]:w-full [&_th]:bg-surface-subtle [&_th]:text-foreground [&_th]:border-border [&_td]:text-foreground [&_td]:border-border"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content || '') }}
            />
        )
    }
    if (block.kind === 'rich_content') {
        return (
            <div className="rounded-xl overflow-hidden border border-border bg-surface-subtle">
                <RichMediaPreview block={block} />
                {block.caption && (
                    <p className="text-[11px] text-muted-foreground text-center px-3 py-2 border-t border-border italic">
                        {block.caption}
                    </p>
                )}
            </div>
        )
    }
    if (block.kind === 'question') {
        return <QuestionPreview block={block} qIndex={qIndex} accent={accent} answeredChoices={answeredChoices} onMark={onMark} />
    }
    return null
}

/* ── Section block list — extracted to avoid deep nesting ── */
function SectionBlockList({ blocks, baseQIndex, accent, answeredChoices, onMark }: {
    readonly blocks: Block[]
    readonly baseQIndex: number
    readonly accent: 'purple' | 'teal'
    readonly answeredChoices: Record<string, string>
    readonly onMark: (qid: string, cid: string) => void
}) {
    if (blocks.length === 0) {
        return <p className="text-sm text-muted-foreground italic py-3">No content in this section yet.</p>
    }
    let localQ = baseQIndex
    return (
        <>
            {blocks.map(block => {
                if (block.kind === 'question') localQ++
                return (
                    <PreviewBlock
                        key={block.id}
                        block={block}
                        accent={accent}
                        qIndex={block.kind === 'question' ? localQ : 0}
                        answeredChoices={answeredChoices}
                        onMark={onMark}
                    />
                )
            })}
        </>
    )
}

/* ── Full-screen module preview ── */
export function ModulePreview({ data, onClose }: { readonly data: ModuleFormData; readonly onClose: () => void }) {
    const [tab, setTab]                                     = useState<'module' | 'refresh'>('module')
    const [collapsedSections, setCollapsedSections]         = useState<Record<string, boolean>>({})
    const [answeredChoices, setAnsweredChoices]             = useState<Record<string, string>>({})
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

    const hasRefresh     = data.hasRefreshModule && (data.refreshSections ?? []).length > 0
    const activeSections = tab === 'refresh' ? (data.refreshSections ?? []) : data.sections
    const accent         = tab === 'refresh' ? 'teal' : 'purple'

    const toggleSection = (id: string) =>
        setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }))

    const scrollTo = (id: string) => {
        const el = sectionRefs.current[id]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setCollapsedSections(prev => ({ ...prev, [id]: false }))
    }

    const onMark = (qid: string, cid: string) =>
        setAnsweredChoices(prev => ({ ...prev, [qid]: cid }))

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-surface/10 backdrop-blur-xl flex flex-col"
        >
            {/* ── Top bar ── */}
            <div className="relative flex items-center justify-between px-6 py-4 bg-surface border-b border-border shadow-sm flex-shrink-0">
                {/* Left: icon + title + meta */}
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent === 'teal' ? 'bg-accent-secondary' : 'bg-primary'}`}>
                        {accent === 'teal' ? <RefreshCw className="w-4.5 h-4.5 text-primary-foreground" /> : <BookOpen className="w-4.5 h-4.5 text-primary-foreground" />}
                    </div>
                    <span className="text-2xl font-bold text-foreground truncate">
                        {data.title || <span className="italic text-muted-foreground">Untitled Module</span>}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {data.difficulty && (
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${DIFFICULTY_COLORS[data.difficulty]}`}>
                                {data.difficulty}
                            </span>
                        )}
                        {data.category && (
                            <span className="px-2.5 py-0.5 rounded bg-surface text-muted-foreground text-xs font-medium">
                                {data.category}
                            </span>
                        )}
                        {data.estimatedTime && (
                            <span className="flex items-center gap-1 text-muted-foreground text-sm">
                                <Clock className="w-3.5 h-3.5" />
                                {data.estimatedTime}
                            </span>
                        )}
                    </div>
                </div>

                {/* Centre: "Preview" label — absolutely centred in the bar */}
                <span className="absolute left-1/2 -translate-x-1/2 text-sm text-muted-foreground italic pointer-events-none select-none hidden sm:block">
                    Preview
                </span>

                {/* Right: tab toggle + close */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {hasRefresh && (
                        <ViewTabToggle
                            view={tab}
                            setView={setTab}
                            mainCount={data.sections.length}
                            refreshCount={(data.refreshSections ?? []).length}
                        />
                    )}
                    <button type="button" onClick={onClose}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-surface hover:bg-surface text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors">
                        <X className="w-4 h-4" />
                        Close
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden bg-surface-subtle">

                {/* ── Left sidebar ── */}
                <div className="w-64 flex-shrink-0 bg-surface border-r border-border flex flex-col overflow-hidden">
                    {/* Cover */}
                    <div className="px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
                        {data.coverImage ? (
                            <img src={data.coverImage} alt="cover"
                                className="w-full h-20 object-cover rounded-lg" />
                        ) : (
                            <div className={`w-full h-20 rounded-lg flex items-center justify-center bg-gradient-to-br ${accent === 'teal' ? 'from-accent-secondary/20 to-surface-subtle' : 'from-primary/20 to-surface-subtle'}`}>
                                {accent === 'teal' ? <RefreshCw className="w-7 h-7 text-accent-secondary/60" /> : <BookOpen className="w-7 h-7 text-primary/60" />}
                            </div>
                        )}
                        {data.description && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2 line-clamp-2">
                                {data.description}
                            </p>
                        )}
                    </div>

                    {/* Task list */}
                    <div className="flex-1 overflow-y-auto py-2">
                        <p className="px-4 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {tab === 'refresh' ? 'Refresh Sections' : 'Sections'}
                        </p>
                        {activeSections.length === 0
                            ? <p className="px-4 py-3 text-xs text-muted-foreground italic">No sections yet</p>
                            : activeSections.map((sec, i) => {
                                const qCount = sec.blocks.filter(b => b.kind === 'question').length
                                const isCollapsed = collapsedSections[sec.id]
                                return (
                                    <button key={sec.id} type="button"
                                        onClick={() => scrollTo(sec.id)}
                                        className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-surface-subtle transition-colors group border-l-2 border-transparent ${accent === 'teal' ? 'hover:border-accent-secondary/60' : 'hover:border-primary/60'}`}>
                                        {(() => {
                                            let badgeCls = accent === 'teal' ? 'bg-accent-secondary text-primary-foreground' : 'bg-primary text-primary-foreground'
                                            if (isCollapsed) badgeCls = 'bg-surface text-muted-foreground'
                                            return (
                                                <span className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${badgeCls}`}>
                                                    {i + 1}
                                                </span>
                                            )
                                        })()}
                                        <div className="min-w-0">
                                            <p className={`text-xs font-semibold text-foreground truncate transition-colors ${accent === 'teal' ? 'group-hover:text-accent-secondary' : 'group-hover:text-primary'}`}>
                                                {sec.title || `Section ${i + 1}`}
                                            </p>
                                            {qCount > 0 && (
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
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
                    {activeSections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                            <Layers className="w-10 h-10 text-slate-200" />
                            <p className="text-sm font-medium">No sections to preview</p>
                        </div>
                    ) : (() => {
                        let globalQIndex = 0
                        return (
                            <div className="max-w-3xl mx-auto px-8 py-8 flex flex-col gap-4">
                                {activeSections.map((sec, i) => {
                                    const isCollapsed = !!collapsedSections[sec.id]
                                    const qCount = sec.blocks.filter(b => b.kind === 'question').length
                                    const baseQIndex = globalQIndex
                                    globalQIndex += qCount

                                    return (
                                        <div
                                            key={sec.id}
                                            ref={el => { sectionRefs.current[sec.id] = el }}
                                            className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden scroll-mt-4"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleSection(sec.id)}
                                                className="w-full flex items-center gap-3 px-6 py-4 bg-surface hover:bg-surface-subtle transition-colors text-left group"
                                            >
                                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0 ${accent === 'teal' ? 'bg-accent-secondary' : 'bg-primary'}`}>
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-base font-bold text-foreground transition-colors truncate ${accent === 'teal' ? 'group-hover:text-accent-secondary' : 'group-hover:text-primary'}`}>
                                                        {sec.title || `Section ${i + 1}`}
                                                    </p>
                                                    {qCount > 0 && (
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {qCount} {qCount === 1 ? 'question' : 'questions'}
                                                        </p>
                                                    )}
                                                </div>
                                                <motion.div
                                                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`text-muted-foreground flex-shrink-0 ${accent === 'teal' ? 'group-hover:text-accent-secondary' : 'group-hover:text-primary'}`}
                                                >
                                                    <ChevronDown className="w-5 h-5" />
                                                </motion.div>
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {!isCollapsed && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-6 pb-6 pt-1 flex flex-col gap-5 border-t border-border">
                                                            <SectionBlockList
                                                                blocks={sec.blocks}
                                                                baseQIndex={baseQIndex}
                                                                accent={accent}
                                                                answeredChoices={answeredChoices}
                                                                onMark={onMark}
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })()}
                </div>
            </div>
        </motion.div>
    )
}
