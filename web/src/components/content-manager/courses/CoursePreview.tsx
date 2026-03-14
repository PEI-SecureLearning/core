import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen, Check, ChevronDown, Clock,
    FileText, Image as ImageIcon, Layers, ListChecks, X,
} from 'lucide-react'
import type { Block, Choice } from '../modules/module-creation/types'
import { DIFFICULTY_COLORS } from '../modules/module-creation/constants'
import { renderMarkdown } from '../modules/module-creation/utils'
import type { PlaceholderModule } from '../modules/module-creation/placeholderModules'

/* ── Preview block renderer ── */
function PreviewBlock({ block, qIndex, answeredChoices, onMark }: {
    readonly block: Block
    readonly qIndex: number
    readonly answeredChoices: Record<string, string>
    readonly onMark: (qid: string, cid: string) => void
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
                    {q.type === 'short_answer' ? (
                        <div className="flex gap-2">
                            <input type="text" placeholder="Your answer…"
                                className="flex-1 bg-surface-subtle border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]/40" />
                            <button type="button"
                                style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }} className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors">
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
                    )}
                </div>
            </div>
        )
    }

    return null
}

/* ── Section row inside a module ── */
function PreviewSection({ modIdx, sec, secIdx, baseQIndex, collapsedSections, onToggle, answeredChoices, onMark }: {
    readonly modIdx: number
    readonly sec: PlaceholderModule['sections'][number]
    readonly secIdx: number
    readonly baseQIndex: number
    readonly collapsedSections: Record<string, boolean>
    readonly onToggle: (key: string) => void
    readonly answeredChoices: Record<string, string>
    readonly onMark: (qid: string, cid: string) => void
}) {
    const sectionKey = `${modIdx}-${sec.id}`
    const isCollapsed = !!collapsedSections[sectionKey]
    const qCount = sec.blocks.filter(b => b.kind === 'question').length

    return (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => onToggle(sectionKey)}
                className="w-full flex items-center gap-3 px-6 py-4 bg-surface hover:bg-surface-subtle transition-colors text-left group"
            >
                <span className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {secIdx + 1}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground group-hover:text-[#A78BFA] transition-colors truncate">
                        {sec.title || `Task ${secIdx + 1}`}
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
                                <p className="text-sm text-muted-foreground italic py-3">No content in this task yet.</p>
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
}

/* ── Module card (header + its sections) ── */
function PreviewModule({ mod, modIdx, collapsedModules, collapsedSections, onToggleModule, onToggleSection, moduleRefs, answeredChoices, onMark }: {
    readonly mod: PlaceholderModule
    readonly modIdx: number
    readonly collapsedModules: Record<string, boolean>
    readonly collapsedSections: Record<string, boolean>
    readonly onToggleModule: (key: string) => void
    readonly onToggleSection: (key: string) => void
    readonly moduleRefs: React.RefObject<Record<string, HTMLElement | null>>
    readonly answeredChoices: Record<string, string>
    readonly onMark: (qid: string, cid: string) => void
}) {
    const moduleKey = `mod-preview-${modIdx}`
    const isCollapsed = !!collapsedModules[moduleKey]

    // Track running question index across sections
    let globalQ = 0

    return (
        <div
            ref={el => { moduleRefs.current[moduleKey] = el }}
            className="scroll-mt-2"
        >
            {/* Module header */}
            <button
                type="button"
                onClick={() => onToggleModule(moduleKey)}
                className="w-full flex items-center gap-4 px-6 py-4 bg-surface border-b-2 border-[#7C3AED]/60 ring-1 ring-border shadow-lg hover:bg-surface-subtle transition-colors text-left group mb-3"
            >
                <img
                    src={mod.image || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60'}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-foreground group-hover:text-[#A78BFA] transition-colors">
                        Module {modIdx + 1}: {mod.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        {mod.difficulty && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${DIFFICULTY_COLORS[mod.difficulty]}`}>
                                {mod.difficulty}
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-surface-subtle text-muted-foreground text-[10px] font-medium">
                            {mod.category}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                            <Clock className="w-3 h-3" />
                            {mod.estimatedTime}
                        </span>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-muted-foreground group-hover:text-[#A78BFA] flex-shrink-0"
                >
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </button>

            {/* Sections */}
            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-4 pl-4">
                            {mod.sections.map((sec, secIdx) => {
                                const baseQIndex = globalQ
                                globalQ += sec.blocks.filter(b => b.kind === 'question').length
                                return (
                                    <PreviewSection
                                        key={`${modIdx}-${sec.id}`}
                                        modIdx={modIdx}
                                        sec={sec}
                                        secIdx={secIdx}
                                        baseQIndex={baseQIndex}
                                        collapsedSections={collapsedSections}
                                        onToggle={onToggleSection}
                                        answeredChoices={answeredChoices}
                                        onMark={onMark}
                                    />
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
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

    const toggleModule = (id: string) => setCollapsedModules(prev => ({ ...prev, [id]: !prev[id] }))
    const toggleSection = (id: string) => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }))
    const onMark = (qid: string, cid: string) => setAnsweredChoices(prev => ({ ...prev, [qid]: cid }))

    const scrollToModule = (id: string) => {
        moduleRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setCollapsedModules(prev => ({ ...prev, [id]: false }))
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex flex-col"
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-surface border-b border-border shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-foreground truncate">
                        {title || <span className="italic text-muted-foreground">Untitled Course</span>}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <Layers className="w-3 h-3" />
                        {modules.length} module{modules.length === 1 ? '' : 's'}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-muted-foreground hidden sm:block italic">Course Preview</span>
                    <button type="button" onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-[#7C3AED]/10 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors">
                        <X className="w-3.5 h-3.5" />
                        Close
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden bg-background">

                {/* Left sidebar – table of contents */}
                <div className="w-64 flex-shrink-0 bg-surface border-r border-border flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto py-2">
                        <p className="px-4 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Modules
                        </p>
                        {modules.map((mod, modIdx) => (
                            <button
                                key={`toc-${mod.id}`}
                                type="button"
                                onClick={() => scrollToModule(`mod-preview-${modIdx}`)}
                                className="w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-surface-subtle transition-colors group border-l-2 border-transparent hover:border-[#7C3AED]/40"
                            >
                                <span className="mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-[#7C3AED] text-white">
                                    {modIdx + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground group-hover:text-[#A78BFA] truncate transition-colors">
                                        {mod.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {mod.estimatedTime} · {mod.sections.length} task{mod.sections.length === 1 ? '' : 's'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="w-full mx-auto px-8 py-8 flex flex-col gap-3">
                        {modules.map((mod, modIdx) => (
                            <PreviewModule
                                key={mod.id}
                                mod={mod}
                                modIdx={modIdx}
                                collapsedModules={collapsedModules}
                                collapsedSections={collapsedSections}
                                onToggleModule={toggleModule}
                                onToggleSection={toggleSection}
                                moduleRefs={moduleRefs}
                                answeredChoices={answeredChoices}
                                onMark={onMark}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

