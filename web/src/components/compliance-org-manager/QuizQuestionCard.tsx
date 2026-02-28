import type { QuizQuestionDraft, QuizQuestion } from "./types";
import { motion, AnimatePresence } from "motion/react";

type QuizQuestionCardProps = {
    question: QuizQuestionDraft;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
    onUpdate: (patch: Partial<QuizQuestion>) => void;
    onRemove: () => void;
    onAddOption: () => void;
    onRemoveOption: (optIndex: number) => void;
};

export default function QuizQuestionCard({
    question,
    index,
    isExpanded,
    onToggle,
    onUpdate,
    onRemove,
    onAddOption,
    onRemoveOption,
}: QuizQuestionCardProps) {
    const baseId = `question-${index}`;

    return (
        <>
            {/* The clickable card */}
            <div
                className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={onToggle}
            >
                <div className="flex-1 text-left min-w-0">
                    <p className="text-xs text-gray-500">Question {index + 1}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {question.prompt || "Untitled question"}
                    </p>
                </div>
                <button
                    type="button"
                    data-testid={`remove-question-${index}`}
                    className="text-xs text-red-600 hover:text-red-700 cursor-pointer shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                >
                    Remove
                </button>
            </div>

            {/* Modal Editor */}
            <AnimatePresence>
                {isExpanded && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            className="absolute inset-0 bg-black/40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onToggle}
                        />
                        <motion.div
                            className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }}
                            exit={{ scale: 0.95, opacity: 0, y: 10, transition: { duration: 0.2, ease: "easeIn" } }}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Edit Question</p>
                                    <h2 className="text-lg font-semibold text-gray-900">Question {index + 1}</h2>
                                </div>
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-purple-700 text-white text-sm font-medium rounded-lg hover:bg-purple-800 transition-colors"
                                    onClick={onToggle}
                                >
                                    Done
                                </button>
                            </div>

                            {/* Modal Body (Scrollable) */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                {/* Question ID */}
                                <div>
                                    <label htmlFor={`${baseId}-id`} className="block text-sm font-medium text-gray-700 mb-1">
                                        Question ID
                                    </label>
                                    <input
                                        id={`${baseId}-id`}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        value={question.id}
                                        onChange={(e) => onUpdate({ id: e.target.value })}
                                    />
                                </div>

                                {/* Prompt */}
                                <div>
                                    <label htmlFor={`${baseId}-prompt`} className="block text-sm font-medium text-gray-700 mb-1">
                                        Prompt
                                    </label>
                                    <textarea
                                        id={`${baseId}-prompt`}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                                        value={question.prompt}
                                        onChange={(e) => onUpdate({ prompt: e.target.value })}
                                    />
                                </div>

                                {/* Options */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-700">Options</p>
                                        <button
                                            type="button"
                                            className="text-xs font-medium text-purple-700 hover:text-purple-800 cursor-pointer"
                                            onClick={onAddOption}
                                        >
                                            + Add option
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {question.options.map((opt, optIndex) => (
                                            <div key={`${question.id}-opt-${optIndex}`} className="flex gap-2">
                                                <input
                                                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const nextOptions = [...question.options];
                                                        nextOptions[optIndex] = e.target.value;
                                                        onUpdate({ options: nextOptions });
                                                    }}
                                                    placeholder={`Option ${optIndex + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors border border-transparent cursor-pointer"
                                                    onClick={() => onRemoveOption(optIndex)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Answer + Feedback */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-gray-100">
                                    <div>
                                        <label htmlFor={`${baseId}-answer`} className="block text-sm font-medium text-gray-700 mb-1">
                                            Correct answer
                                        </label>
                                        <select
                                            id={`${baseId}-answer`}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                            value={question.answer_index}
                                            onChange={(e) => onUpdate({ answer_index: Number(e.target.value) })}
                                        >
                                            {question.options.map((opt, idx) => (
                                                <option key={`${question.id}-ans-${idx}`} value={idx}>
                                                    Option {idx + 1} {opt ? `- ${opt.substring(0, 20)}${opt.length > 20 ? '...' : ''}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor={`${baseId}-feedback`} className="block text-sm font-medium text-gray-700 mb-1">
                                            Feedback
                                        </label>
                                        <textarea
                                            id={`${baseId}-feedback`}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                            value={question.feedback}
                                            onChange={(e) => onUpdate({ feedback: e.target.value })}
                                            placeholder="Explanation shown after answering"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
