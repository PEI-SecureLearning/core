import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, BookOpen, Check, ChevronDown, Clock,
    FileText, Image as ImageIcon, Layers, ListChecks, X,
} from 'lucide-react'
import type { Block, Choice, ModuleFormData } from '../modules/module-creation/types'
import { DIFFICULTY_COLORS } from '../modules/module-creation/constants'
import { renderMarkdown } from '../modules/module-creation/utils'

/* ── reuse the same block renderer as ModulePreview ── */
function PreviewBlock({ block, qIndex, answeredChoices, onMark, interactive }: {
    readonly block: Block
    readonly qIndex: number
    readonly answeredChoices: Record<string, string>
    readonly onMark: (qid: string, cid: string) => void
    readonly interactive: boolean
}) {
    if (block.kind === 'text') {
        return (
            <div
                className="text-[15px] leading-7 text-foreground [&_h1]:text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_strong]:text-foreground [&_strong]:font-semibold [&_em]:text-muted-foreground [&_a]:text-[#A78BFA] [&_a]:underline [&_code]:bg-surface-subtle [&_code]:text-[#A78BFA] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono [&_pre]:bg-[#0C0A0F] [&_pre]:rounded-xl [&_pre]:text-green-300 [&_pre]:my-4 [&_li]:text-foreground [&_li]:leading-7 [&_blockquote]:border-[#7C3AED]/40 [&_blockquote]:text-muted-foreground [&_blockquote]:bg-[#7C3AED]/10 [&_blockquote]:py-1 [&_hr]:border-border [&_del]:text-muted-foreground [&_table]:w-full [&_th]:bg-surface-subtle [&_th]:text-foreground [&_th]:border-border [&_td]:text-foreground [&_td]:border-border"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content || '') }}
            />
        )
    }

    if (block.kind === 'rich_content') {
        const renderMedia = () => {
            if (!block.url) return (
                <div className="flex items-center justify-center h-24 text-muted-foreground gap-2 text-sm italic">
                    <ImageIcon className="w-5 h-5" /> No media URL set
                </div>
            )
            if (block.mediaType === 'image') return <img src={block.url} alt={block.caption || 'media'} className="w-full max-h-80 object-contain" />
            if (block.mediaType === 'video') return <video src={block.url} controls className="w-full max-h-80"><track kind="captions" /></video>
            if (block.mediaType === 'audio') return <audio src={block.url} controls className="w-full px-4 py-3"><track kind="captions" /></audio>
            return (
                <a href={block.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-[#A78BFA] font-medium hover:text-[#7C3AED] transition-colors">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{block.url}</span>
                </a>
            )
        }

        return (
            <div className="rounded-xl overflow-hidden border border-border bg-surface-subtle">
                {renderMedia()}
                {block.caption && (
                    <p className="text-[11px] text-muted-foreground text-center px-3 py-2 border-t border-border italic">
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
        else if (q.type === 'true_false') typeLabel = 'True / False'

        const choices: Choice[] = q.type === 'true_false'
            ? [{ id: 'tf-t', text: 'True', isCorrect: true }, { id: 'tf-f', text: 'False', isCorrect: false }]
            : q.choices

        const choiceBtnClass = (c: Choice) => {
            const isSelected = answered === c.id
            if (!isSelected) return 'bg-surface border-border text-foreground hover:bg-[#7C3AED]/10 hover:border-[#7C3AED]/30'
            if (c.isCorrect) return 'bg-green-50 border-green-400 text-green-800'
            return 'bg-red-50 border-red-400 text-red-800'
        }

        const choiceCircleClass = (c: Choice) => {
            const isSelected = answered === c.id
            if (!isSelected) return 'border-border'
            if (c.isCorrect) return 'border-green-500 bg-green-100'
            return 'border-red-500 bg-red-100'
        }

        const interactiveInput = q.type === 'short_answer' ? (
            <div className="flex gap-2">
                <input type="text" placeholder="Your answer…"
                    className="flex-1 bg-surface-subtle border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]/40" />
                <button type="button" style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }} className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors">
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
                                {isSelected && c.isCorrect && <Check className="w-2.5 h-2.5 text-green-600" />}
                                {isSelected && !c.isCorrect && <X className="w-2.5 h-2.5 text-red-600" />}
                            </span>
                            <span className="flex-1">{c.text || <em className="text-muted-foreground">Empty choice</em>}</span>
                        </button>
                    )
                })}
            </div>
        )

        const readOnlyList = (
            /* ── Read-only: plain lettered list of options ── */
            <ul className="flex flex-col gap-1.5">
                {choices.map((c, idx) => (
                    <li key={c.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-subtle border border-border text-sm text-foreground">
                        <span className="w-5 h-5 rounded-full border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                            {String.fromCodePoint(65 + idx)}
                        </span>
                        <span>{c.text || <em className="text-muted-foreground">Empty choice</em>}</span>
                    </li>
                ))}
            </ul>
        )

        return (
            <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-subtle border-b border-border">
                    <ListChecks className="w-3.5 h-3.5 text-[#A78BFA] flex-shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#A78BFA]">{typeLabel}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">Q{qIndex}</span>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-foreground leading-relaxed mb-4">
                        {q.text || <em className="text-muted-foreground font-normal">No question text</em>}
                    </p>
                    {interactive ? interactiveInput : readOnlyList}
                </div>
            </div>
        )
    }

    return null
}

/* ── Module Detail View (full-page, not a modal) ── */
interface ModuleDetailViewProps {
    readonly data: ModuleFormData & { image?: string }
    readonly onBack: () => void
    /** When false, quiz questions are displayed as static read-only lists with no inputs. Default: true */
    readonly interactive?: boolean
}

export function ModuleDetailView({ data, onBack, interactive = true }: ModuleDetailViewProps) {
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
    const [answeredChoices, setAnsweredChoices] = useState<Record<string, string>>({})
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

    const toggleSection = (id: string) =>
        setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }))

    const scrollTo = (id: string) => {
        const el = sectionRefs.current[id]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setCollapsedSections(prev => ({ ...prev, [id]: false }))
    }

    const onMark = (qid: string, cid: string) =>
        setAnsweredChoices(prev => ({ ...prev, [qid]: cid }))

    let globalQIndex = 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background flex flex-col w-full"
        >
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between px-6 py-3 bg-surface border-b border-border shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#A78BFA] transition-colors flex-shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Modules
                    </button>
                    <div className="h-5 w-px bg-border flex-shrink-0" />
                    <div className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-foreground truncate">
                        {data.title}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {data.difficulty && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${DIFFICULTY_COLORS[data.difficulty]}`}>
                                {data.difficulty}
                            </span>
                        )}
                        {data.category && (
                            <span className="px-2 py-0.5 rounded bg-surface-subtle text-muted-foreground text-[10px] font-medium">
                                {data.category}
                            </span>
                        )}
                        {data.estimatedTime && (
                            <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                                <Clock className="w-3 h-3" />
                                {data.estimatedTime}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden bg-background w-full">

                {/* ── Left sidebar ── */}
                <div className="w-64 flex-shrink-0 bg-surface border-r border-border flex flex-col overflow-hidden">
                    {/* Cover */}
                    <div className="px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
                        {data.coverImage ? (
                            <img src={data.coverImage} alt="cover" className="w-full h-20 object-cover rounded-lg" />
                        ) : (
                            <div className="w-full h-20 rounded-lg bg-surface-subtle flex items-center justify-center">
                                <BookOpen className="w-7 h-7 text-[#7C3AED]/40" />
                            </div>
                        )}
                        {data.description && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2 line-clamp-3">
                                {data.description}
                            </p>
                        )}
                    </div>

                    {/* Task list */}
                    <div className="flex-1 overflow-y-auto py-2">
                        <p className="px-4 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Tasks
                        </p>
                        {data.sections.length === 0
                            ? <p className="px-4 py-3 text-xs text-muted-foreground italic">No tasks yet</p>
                            : data.sections.map((sec, i) => {
                                const qCount = sec.blocks.filter(b => b.kind === 'question').length
                                const isCollapsed = collapsedSections[sec.id]
                                return (
                                    <button key={sec.id} type="button"
                                        onClick={() => scrollTo(sec.id)}
                                        className="w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-surface-subtle transition-colors group border-l-2 border-transparent hover:border-[#7C3AED]/40">
                                        <span className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isCollapsed ? 'bg-surface text-muted-foreground' : 'bg-[#7C3AED] text-white'
                                            }`}>
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-foreground group-hover:text-[#A78BFA] truncate transition-colors">
                                                {sec.title || `Task ${i + 1}`}
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
                <div className="w-full flex-1 overflow-y-auto">
                    {data.sections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                            <Layers className="w-10 h-10 text-muted-foreground/20" />
                            <p className="text-sm font-medium">No sections available</p>
                        </div>
                    ) : (
                        <div className="w-full px-8 py-6 flex flex-col gap-4">
                            {data.sections.map((sec, i) => {
                                const isCollapsed = !!collapsedSections[sec.id]
                                const qCount = sec.blocks.filter(b => b.kind === 'question').length
                                const baseQIndex = globalQIndex
                                globalQIndex += qCount

                                return (
                                    <div
                                        key={sec.id}
                                        ref={el => { sectionRefs.current[sec.id] = el }}
                                        className="w-full bg-surface rounded-2xl border border-border shadow-sm overflow-hidden scroll-mt-4"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(sec.id)}
                                            className="w-full flex items-center gap-3 px-6 py-4 bg-surface hover:bg-surface-subtle transition-colors text-left group"
                                        >
                                            <span className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-bold text-foreground group-hover:text-[#A78BFA] transition-colors truncate">
                                                    {sec.title || `Task ${i + 1}`}
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
                                                className="text-muted-foreground group-hover:text-[#A78BFA] flex-shrink-0"
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
                                                        {sec.blocks.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground italic py-3">
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
                                                                        interactive={interactive}
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
