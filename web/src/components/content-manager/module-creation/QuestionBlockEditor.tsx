import { Check, ListChecks, Plus, Text, ToggleLeft, X } from 'lucide-react'
import { useState } from 'react'
import type { Choice, Question, QuestionBlock, QuestionType } from './types'
import { TRUE_FALSE_CHOICES, uid } from './constants'

const QUESTION_TYPE_META: Record<QuestionType, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
    multiple_choice: { label: 'Multiple Choice', Icon: ListChecks },
    true_false:      { label: 'True / False',    Icon: ToggleLeft },
    short_answer:    { label: 'Short Answer',    Icon: Text       },
}

export function QuestionBlockEditor({ block, onUpdate, onRemove }: {
    readonly block: QuestionBlock
    readonly onUpdate: (q: Question) => void
    readonly onRemove: () => void
}) {
    const q = block.question
    const [isHovered, setIsHovered] = useState(false)

    const addChoice    = () => onUpdate({ ...q, choices: [...q.choices, { id: uid(), text: '', isCorrect: false }] })
    const removeChoice = (id: string) => onUpdate({ ...q, choices: q.choices.filter(c => c.id !== id) })
    const patchChoice  = (id: string, patch: Partial<Choice>) =>
        onUpdate({ ...q, choices: q.choices.map(c => c.id === id ? { ...c, ...patch } : c) })
    const setCorrect   = (id: string) =>
        onUpdate({ ...q, choices: q.choices.map(c => ({ ...c, isCorrect: c.id === id })) })

    const choices = q.type === 'true_false' ? TRUE_FALSE_CHOICES : q.choices

    return (
        <div 
            className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 mr-2">
                    Question
                </span>
                <div className={`flex gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
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
