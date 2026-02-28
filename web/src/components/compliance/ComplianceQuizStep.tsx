import { ArrowUpRight, CheckCircle2, RotateCcw, ShieldCheck, Timer } from "lucide-react";
import type { QuizPayload, SubmitResponse } from "./types";
import { apiClient } from "../../lib/api-client";

type ComplianceQuizStepProps = {
    quiz: QuizPayload;
    answers: Record<string, number>;
    answeredCount: number;
    result: SubmitResponse | null;
    remainingCooldown: number;
    cooldownProgress: number;
    submitting: boolean;
    onAnswerChange: (questionId: string, optionIdx: number) => void;
    onSubmit: () => void;
    onReviewDoc: () => void;
    onRetake: (freshQuiz: QuizPayload) => void;
    clearPersistedFailure: () => void;
};

export default function ComplianceQuizStep({
    quiz,
    answers,
    answeredCount,
    result,
    remainingCooldown,
    cooldownProgress,
    submitting,
    onAnswerChange,
    onSubmit,
    onReviewDoc,
    onRetake,
    clearPersistedFailure,
}: ComplianceQuizStepProps) {
    return (
        <div className="space-y-4">
            {/* Quiz header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex text-lg items-center gap-2 text-slate-700 font-semibold">
                    <span>Score at least {quiz.required_score}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                    <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                        {answeredCount}/{quiz.questions.length} answered
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                        Required: {quiz.required_score}%+
                    </span>
                    {remainingCooldown > 0 && (
                        <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                            Cooldown: {remainingCooldown}s
                        </span>
                    )}
                </div>
            </div>

            {/* Failed banner */}
            {result && !result.passed ? (
                <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/60 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-orange-800">
                            <div>
                                <p className="font-semibold">You didn't pass this time</p>
                                <p className="text-md font-light">Score {result.score}% (need {result.required_score}%)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full border border-orange-200 bg-white/80 flex items-center justify-center text-xs font-semibold text-orange-700"
                                style={{
                                    background: `conic-gradient(#fb923c ${cooldownProgress * 360}deg, #fde7d3 ${cooldownProgress * 360}deg 360deg)`,
                                }}
                            >
                                {remainingCooldown}s
                            </div>
                            <div className="px-3 py-2 rounded-full bg-white/70 text-orange-800 border border-orange-200 text-xs font-semibold">
                                Try again in {remainingCooldown}s
                            </div>
                        </div>
                    </div>
                    {/* Feedback list */}
                    <div className="rounded-lg border border-orange-100 bg-white p-3">
                        <p className="font-semibold text-md text-slate-800 mb-2">What to review</p>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                            {result.feedback.map((f) => (
                                <li key={f.id} className={f.correct ? "text-green-800 font-medium" : "text-orange-800 font-medium"}>
                                    {f.feedback}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            className="px-3 py-2 bg-white rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 inline-flex items-center gap-2"
                            onClick={onReviewDoc}
                        >
                            <ArrowUpRight className="h-4 w-4" />
                            Review document
                        </button>
                        <button
                            className="px-3 py-2 bg-white rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={async () => {
                                clearPersistedFailure();
                                const refreshed = await apiClient.get<QuizPayload>("/compliance/latest/quiz");
                                onRetake(refreshed);
                            }}
                            disabled={remainingCooldown > 0}
                        >
                            <RotateCcw className="h-4 w-4" />
                            Retake quiz
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Question list */}
                    <div className="space-y-4">
                        {quiz.questions?.map((q, idx) => (
                            <div key={q.id} className="rounded-b-lg border-t-2 border-purple-700 ring ring-gray-200 p-4 shadow-md bg-white">
                                <p className="font-semibold text-gray-900 mb-3">
                                    {idx + 1}. {q.prompt}
                                </p>
                                <div className="space-y-2 bg-gray-50/50 rounded-lg">
                                    {q.options.map((opt, optIdx) => {
                                        const selected = answers[q.id] === optIdx;
                                        return (
                                            <label
                                                key={optIdx}
                                                className={`flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer transition ${selected
                                                    ? "border-purple-500 bg-purple-50"
                                                    : "border-transparent hover:bg-gray-100"
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    className="mt-1 cursor-pointer accent-purple-600"
                                                    name={q.id}
                                                    value={optIdx}
                                                    checked={selected}
                                                    onChange={() => onAnswerChange(q.id, optIdx)}
                                                    disabled={remainingCooldown > 0}
                                                />
                                                <span className={`text-sm ${selected ? "text-purple-800" : "text-slate-700 font-medium"} `}>{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Passed banner */}
                    {result?.passed && (
                        <div className="rounded-xl border border-green-200 bg-green-50/80 text-green-800 px-4 py-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-semibold">Passed</span>
                            </div>
                            <p className="text-sm mt-1">Score {result.score}% (need {result.required_score}%)</p>
                            <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                                {result.feedback.map((f) => (
                                    <li key={f.id} className="text-green-800">{f.feedback}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Submit row */}
                    <div className="flex items-center justify-between">
                        {remainingCooldown > 0 ? (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Timer className="h-4 w-4" />
                                <span>Try again in {remainingCooldown}s</span>
                            </div>
                        ) : (
                            <div />
                        )}
                        <button
                            className="px-7 py-2 bg-purple-700 font-semibold text-white rounded-lg hover:bg-purple-800 transition disabled:opacity-60 cursor-pointer"
                            onClick={onSubmit}
                            disabled={submitting || remainingCooldown > 0}
                        >
                            {submitting ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
