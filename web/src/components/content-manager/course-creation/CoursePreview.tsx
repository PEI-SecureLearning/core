import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen, Check, ChevronDown, Clock,
    FileText, Image as ImageIcon, Layers, ListChecks, X,
} from 'lucide-react'
import type { Block, Choice } from '../module-creation/types'
import { DIFFICULTY_COLORS } from '../module-creation/constants'
import { renderMarkdown } from '../module-creation/utils'
import type { PlaceholderModule } from '../module-creation/placeholderModules'

/* ── Preview block renderer (same as ModuleDetailView) ── */
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
            if (!block.url) return (
                <div className="flex items-center justify-center h-24 text-slate-400 gap-2 text-sm italic">
                    <ImageIcon className="w-5 h-5" /> No media URL set
                </div>
            )
            if (block.mediaType === 'image') return <img src={block.url} alt={block.caption || 'media'} className="w-full max-h-80 object-contain" />
            if (block.mediaType === 'video') return <video src={block.url} controls className="w-full max-h-80"><track kind="captions" /></video>
            if (block.mediaType === 'audio') return <audio src={block.url} controls className="w-full px-4 py-3"><track kind="captions" /></audio>
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
        else if (q.type === 'true_false') typeLabel = 'True / False'

        const choices: Choice[] = q.type === 'true_false'
            ? [{ id: 'tf-t', text: 'True', isCorrect: true }, { id: 'tf-f', text: 'False', isCorrect: false }]
            : q.choices

        const choiceBtnClass = (c: Choice) => {
            const isSelected = answered === c.id
            if (!isSelected) return 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50/50 hover:border-purple-200'
            if (c.isCorrect) return 'bg-green-50 border-green-400 text-green-800'
            return 'bg-red-50 border-red-400 text-red-800'
        }

        const choiceCircleClass = (c: Choice) => {
            const isSelected = answered === c.id
            if (!isSelected) return 'border-slate-300'
            if (c.isCorrect) return 'border-green-500 bg-green-100'
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
                                            {isSelected && c.isCorrect && <Check className="w-2.5 h-2.5 text-green-600" />}
                                            {isSelected && !c.isCorrect && <X className="w-2.5 h-2.5 text-red-600" />}
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

/* ── Full-screen Course Preview ── */
interface CoursePreviewProps {
    readonly title: string
    readonly modules: PlaceholderModule[]
    readonly onClose: () => void
}

export function CoursePreview({ title, modules, onClose }: CoursePreviewProps) {
    const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({})
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
    const [answeredChoices, setAnsweredChoices] = useState<Record<string, string>>({})
    const moduleRefs = useRef<Record<string, HTMLElement | null>>({})

    const toggleModule = (id: string) =>
        setCollapsedModules(prev => ({ ...prev, [id]: !prev[id] }))

    const toggleSection = (id: string) =>
        setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }))

    const scrollToModule = (id: string) => {
        const el = moduleRefs.current[id]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setCollapsedModules(prev => ({ ...prev, [id]: false }))
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
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-800 truncate">
                        {title || <span className="italic text-slate-400">Untitled Course</span>}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Layers className="w-3 h-3" />
                        {modules.length} module{modules.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-slate-400 hidden sm:block italic">Course Preview</span>
                    <button type="button" onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold transition-colors">
                        <X className="w-3.5 h-3.5" />
                        Close
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden bg-slate-50">

                {/* Left sidebar – table of contents */}
                <div className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto py-2">
                        <p className="px-4 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Modules
                        </p>
                        {modules.map((mod, modIdx) => (
                            <button
                                key={`toc-${modIdx}`}
                                type="button"
                                onClick={() => scrollToModule(`mod-preview-${modIdx}`)}
                                className="w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-slate-50 transition-colors group border-l-2 border-transparent hover:border-purple-300"
                            >
                                <span className="mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-purple-600 text-white">
                                    {modIdx + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-700 group-hover:text-purple-700 truncate transition-colors">
                                        {mod.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {mod.estimatedTime} · {mod.sections.length} task{mod.sections.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="w-fullmax-w-3xl mx-auto px-8 py-8 flex flex-col gap-8">
                        {modules.map((mod, modIdx) => {
                            const isModuleCollapsed = !!collapsedModules[`mod-preview-${modIdx}`]

                            return (
                                <div
                                    key={`mod-preview-${modIdx}`}
                                    ref={el => { moduleRefs.current[`mod-preview-${modIdx}`] = el }}
                                    className="scroll-mt-4"
                                >
                                    {/* Module header */}
                                    <button
                                        type="button"
                                        onClick={() => toggleModule(`mod-preview-${modIdx}`)}
                                        className="w-full flex items-center gap-4 px-6 py-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-left group mb-4"
                                    >
                                        <img
                                            src={mod.image}
                                            alt={mod.title}
                                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                                                Module {modIdx + 1}: {mod.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {mod.difficulty && (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${DIFFICULTY_COLORS[mod.difficulty]}`}>
                                                        {mod.difficulty}
                                                    </span>
                                                )}
                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                                                    {mod.category}
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                                                    <Clock className="w-3 h-3" />
                                                    {mod.estimatedTime}
                                                </span>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isModuleCollapsed ? -90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-slate-400 group-hover:text-purple-500 flex-shrink-0"
                                        >
                                            <ChevronDown className="w-5 h-5" />
                                        </motion.div>
                                    </button>

                                    {/* Module content — sections */}
                                    <AnimatePresence initial={false}>
                                        {!isModuleCollapsed && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex flex-col gap-4 pl-4">
                                                    {mod.sections.map((sec, secIdx) => {
                                                        const sectionKey = `${modIdx}-${sec.id}`
                                                        const isSectionCollapsed = !!collapsedSections[sectionKey]
                                                        const qCount = sec.blocks.filter(b => b.kind === 'question').length
                                                        const baseQIndex = globalQIndex
                                                        globalQIndex += qCount

                                                        return (
                                                            <div
                                                                key={sectionKey}
                                                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleSection(sectionKey)}
                                                                    className="w-full flex items-center gap-3 px-6 py-4 bg-white hover:bg-slate-50 transition-colors text-left group"
                                                                >
                                                                    <span className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                                        {secIdx + 1}
                                                                    </span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-base font-bold text-slate-800 group-hover:text-purple-700 transition-colors truncate">
                                                                            {sec.title || `Task ${secIdx + 1}`}
                                                                        </p>
                                                                        {qCount > 0 && (
                                                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                                                {qCount} {qCount === 1 ? 'question' : 'questions'}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <motion.div
                                                                        animate={{ rotate: isSectionCollapsed ? -90 : 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="text-slate-400 group-hover:text-purple-500 flex-shrink-0"
                                                                    >
                                                                        <ChevronDown className="w-5 h-5" />
                                                                    </motion.div>
                                                                </button>

                                                                <AnimatePresence initial={false}>
                                                                    {!isSectionCollapsed && (
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
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
