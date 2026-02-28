import { motion, AnimatePresence } from "motion/react";
import type { QuizQuestionDraft, QuizQuestion, QuizSettings as QuizSettingsType } from "./types";
import QuizSettings from "./QuizSettings";
import QuizQuestionCard from "./QuizQuestionCard";

type QuizEditorProps = {
    quizDraft: QuizQuestionDraft[];
    quizSettings: QuizSettingsType;
    quizUpdated: string;
    collapsed: boolean;
    onToggleCollapse: () => void;
    maxQuestionCount: number;
    possiblePassingScores: number[];
    expandedQuestions: Set<string>;
    onQuestionCountChange: (delta: 1 | -1) => void;
    onPassingScoreChange: (delta: 1 | -1) => void;
    onToggleQuestion: (localId: string) => void;
    onUpdateQuestion: (index: number, patch: Partial<QuizQuestion>) => void;
    onRemoveQuestion: (index: number) => void;
    onAddOption: (index: number) => void;
    onRemoveOption: (qIndex: number, optIndex: number) => void;
    onAddQuestion: () => void;
};

export default function QuizEditor({
    quizDraft,
    quizSettings,
    quizUpdated,
    collapsed,
    onToggleCollapse,
    maxQuestionCount,
    possiblePassingScores,
    expandedQuestions,
    onQuestionCountChange,
    onPassingScoreChange,
    onToggleQuestion,
    onUpdateQuestion,
    onRemoveQuestion,
    onAddOption,
    onRemoveOption,
    onAddQuestion,
}: QuizEditorProps) {
    return (
        <section className={`flex flex-col overflow-hidden ${collapsed ? "shrink-0" : "flex-1 min-h-0"}`}>
            {/* Section header */}
            <div
                className="flex items-center justify-between cursor-pointer select-none shrink-0"
                onClick={onToggleCollapse}
            >
                <div className="flex items-center gap-2">
                    <motion.svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: collapsed ? 0 : 90 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Quiz Question Bank</h2>
                        <p className="text-xs text-gray-500">Last updated: {quizUpdated}</p>
                    </div>
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        key="quiz-content"
                        className="flex-1 min-h-0 flex flex-col mt-4"
                        initial={{ height: 0, opacity: 0, y: -20 }}
                        animate={{ height: "auto", opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeInOut" } }}
                        exit={{ height: 0, opacity: 0, y: -20, transition: { duration: 0.25, ease: "easeOut" } }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                    >
                        <div className="pt-4 space-y-4 flex-1 min-h-0 overflow-y-auto bg-gray-50/10 rounded-lg border border-gray-150 p-6">
                            {/* Settings steppers */}
                            <div className="flex flex-row justify-end items-center space-x-8 pr-2">
                                <QuizSettings
                                    questionCount={quizSettings.question_count}
                                    passingScore={quizSettings.passing_score}
                                    maxQuestionCount={maxQuestionCount}
                                    possiblePassingScores={possiblePassingScores}
                                    onQuestionCountChange={onQuestionCountChange}
                                    onPassingScoreChange={onPassingScoreChange}
                                />

                                <button
                                    data-testid="add-question-btn"
                                    className="h-fit translate-y-6 py-2 px-4 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 cursor-pointer"
                                    onClick={onAddQuestion}
                                >
                                    Add question
                                </button>

                            </div>

                            {/* Question cards */}
                            {quizDraft.map((question, qIndex) => (
                                <QuizQuestionCard
                                    key={question.local_id}
                                    question={question}
                                    index={qIndex}
                                    isExpanded={expandedQuestions.has(question.local_id)}
                                    onToggle={() => onToggleQuestion(question.local_id)}
                                    onUpdate={(patch) => onUpdateQuestion(qIndex, patch)}
                                    onRemove={() => onRemoveQuestion(qIndex)}
                                    onAddOption={() => onAddOption(qIndex)}
                                    onRemoveOption={(optIndex) => onRemoveOption(qIndex, optIndex)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
