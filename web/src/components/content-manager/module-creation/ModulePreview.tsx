import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Check, ChevronDown, Clock, FileText, Image as ImageIcon, Layers, ListChecks, X } from 'lucide-react'
import type { Block, Choice, ModuleFormData } from './types'
import { DIFFICULTY_COLORS } from './constants'
import { renderMarkdown } from './utils'

/* ── Preview block (light-theme renderer) ── */
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

        const choices: Choice[] = q.type === 'true_false'
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
                                            {isSelected && !c.isCorrect && <X     className="w-2.5 h-2.5 text-red-600"   />}
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

/* ── Full-screen module preview ── */
export function ModulePreview({ data, onClose }: { readonly data: ModuleFormData; readonly onClose: () => void }) {
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
    const [answeredChoices, setAnsweredChoices]     = useState<Record<string, string>>({})
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
                                const qCount = sec.blocks.filter(b => b.kind === 'question').length
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
