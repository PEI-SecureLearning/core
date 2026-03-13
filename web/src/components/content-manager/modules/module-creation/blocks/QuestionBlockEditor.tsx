import { Check, ListChecks, Plus, Text, ToggleLeft, X } from 'lucide-react'
import type { Choice, Question, QuestionBlock, QuestionType } from '../types'
import { TRUE_FALSE_CHOICES, uid } from '../constants'
import { isQuestionValid } from '../utils'
import { BlockWarning } from './BlockWarning'
import { AutoResizeTextarea } from './AutoResizeTextarea'

const QUESTION_TYPE_META: Record<QuestionType, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
    multiple_choice: { label: 'Multiple Choice', Icon: ListChecks },
    true_false:      { label: 'True / False',    Icon: ToggleLeft },
    short_answer:    { label: 'Short Answer',    Icon: Text       },
}

function questionWarning(needsText: boolean, needsMoreOpts: boolean, needsOptionText: boolean, needsCorrect: boolean): string {
    if (needsText)       return 'Enter the question text.'
    if (needsMoreOpts)   return 'Add at least 2 answer options.'
    if (needsOptionText) return 'Fill in the text for all answer options.'
    if (needsCorrect)    return 'Mark one option as the correct answer.'
    return 'This question is incomplete.'
}

export function QuestionBlockEditor({ block, onUpdate, onRemove, publishAttempted }: {
    readonly block: QuestionBlock
    readonly onUpdate: (q: Question) => void
    readonly onRemove: () => void
    readonly publishAttempted?: boolean
}) {
    const q = block.question

    const addChoice    = () => onUpdate({ ...q, choices: [...q.choices, { id: uid(), text: '', isCorrect: false }] })
    const removeChoice = (id: string) => onUpdate({ ...q, choices: q.choices.filter(c => c.id !== id) })
    const patchChoice  = (id: string, patch: Partial<Choice>) =>
        onUpdate({ ...q, choices: q.choices.map(c => c.id === id ? { ...c, ...patch } : c) })
    const setCorrect   = (id: string) =>
        onUpdate({ ...q, choices: q.choices.map(c => ({ ...c, isCorrect: c.id === id })) })

    const choices = q.type === 'true_false' ? TRUE_FALSE_CHOICES : q.choices

    const showWarning     = publishAttempted === true && !isQuestionValid(block)
    const needsText       = !q.text.trim()
    const needsMoreOpts   = q.type === 'multiple_choice' && q.choices.length < 2
    const needsOptionText = q.type === 'multiple_choice' && q.choices.some(c => !c.text.trim())
    const needsCorrect    = q.type === 'multiple_choice' && !q.choices.some(c => c.isCorrect)

    return (
        <div
            className={`flex flex-col border rounded-xl overflow-hidden bg-surface group transition-colors ${
                showWarning ? 'border-amber-400' : 'border-border'
            }`}
        >
            <div className="flex items-center justify-between px-3 py-1.5 bg-surface-subtle border-b border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#7C3AED]/15 text-[#A78BFA] mr-2">
                    Question
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    {(Object.entries(QUESTION_TYPE_META) as [QuestionType, typeof QUESTION_TYPE_META[QuestionType]][]).map(([type, meta]) => (
                        <button key={type} type="button"
                            onClick={() => onUpdate({ ...q, type, choices: type === 'multiple_choice' ? q.choices : [] })}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all
                                ${q.type === type ? 'bg-[#7C3AED] text-white border-purple-600' : 'bg-surface text-muted-foreground border-border hover:border-[#7C3AED]/40'}`}>
                            <meta.Icon className="w-3 h-3" />
                            <span className="hidden sm:inline">{meta.label}</span>
                        </button>
                    ))}
                </div>
                <button type="button" onClick={onRemove} className="ml-auto text-muted-foreground/50 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="px-4 pt-3 pb-2">
                <AutoResizeTextarea
                    value={q.text}
                    onChange={e => onUpdate({ ...q, text: e.target.value })}
                    placeholder="Type your question here..."
                    className="w-full text-sm bg-surface-subtle border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 text-foreground placeholder:text-muted-foreground"
                />
            </div>

            <div className="px-4 pb-4 flex flex-col gap-2">
                {q.type === 'short_answer' ? (
                    <AutoResizeTextarea
                        value={q.answer}
                        onChange={e => onUpdate({ ...q, answer: e.target.value })}
                        placeholder="Expected answer (optional)..."
                        className="w-full text-sm bg-surface-subtle border border-dashed border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 text-foreground placeholder:text-muted-foreground italic"
                    />
                ) : (
                    <>
                        {choices.map((choice, ci) => (
                            <div key={choice.id} className="flex items-center gap-2">
                                <button type="button"
                                    onClick={() => q.type !== 'true_false' && setCorrect(choice.id)}
                                    title="Mark as correct"
                                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center
                                        ${choice.isCorrect ? 'bg-green-500 border-green-500' : 'border-border hover:border-green-400'}`}>
                                    {choice.isCorrect && <Check className="w-3 h-3 text-white" />}
                                </button>
                                {q.type === 'true_false' ? (
                                    <span className="flex-1 text-sm text-muted-foreground bg-surface-subtle border border-border rounded-lg px-3 py-2">{choice.text}</span>
                                ) : (
                                    <AutoResizeTextarea
                                        value={choice.text}
                                        onChange={e => patchChoice(choice.id, { text: e.target.value })}
                                        placeholder={`Option ${ci + 1}`}
                                        className="flex-1 text-sm bg-surface-subtle border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 text-foreground placeholder:text-muted-foreground"
                                    />
                                )}
                                {q.type === 'multiple_choice' && (
                                    <button type="button" onClick={() => removeChoice(choice.id)}
                                        className="text-muted-foreground/50 hover:text-red-400 transition-colors flex-shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {q.type === 'multiple_choice' && (
                            <button type="button" onClick={addChoice}
                                className="flex items-center gap-1 mt-1 text-xs text-[#A78BFA] hover:text-[#A78BFA] transition-colors self-start">
                                <Plus className="w-3 h-3" /> Add option
                            </button>
                        )}
                    </>
                )}
            </div>

            {showWarning && <BlockWarning message={questionWarning(needsText, needsMoreOpts, needsOptionText, needsCorrect)} />}
        </div>
    )
}
