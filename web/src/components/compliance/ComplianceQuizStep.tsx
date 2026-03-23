import { ArrowUpRight, CheckCircle2, RotateCcw, Timer } from "lucide-react";
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
                <div className="flex text-lg items-center gap-2 text-foreground/90 font-semibold">
                    <span>Score at least {quiz.required_score}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {answeredCount}/{quiz.questions.length} answered
                    </span>
                    <span className="px-2 py-1 rounded-full bg-surface-subtle text-foreground/90 border border-border">
                        Required: {quiz.required_score}%+
                    </span>
                    {remainingCooldown > 0 && (
                        <span className="px-2 py-1 rounded-full bg-warning/10 text-warning border border-warning/20">
                            Cooldown: {remainingCooldown}s
                        </span>
                    )}
                </div>
            </div>

            {/* Failed banner */}
            {result && !result.passed ? (
                <div className="space-y-4 rounded-xl border border-warning/20 bg-warning/10 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-warning">
                            <div>
                                <p className="font-semibold">You didn't pass this time</p>
                                <p className="text-md font-light">Score {result.score}% (need {result.required_score}%)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full border border-warning/20 bg-background/80 flex items-center justify-center text-xs font-semibold text-warning"
                                style={{
                                    background: `conic-gradient(var(--warning) ${cooldownProgress * 360}deg, rgba(var(--warning-rgb), 0.2) ${cooldownProgress * 360}deg 360deg)`,
                                }}
                            >
                                {remainingCooldown}s
                            </div>
                            <div className="px-3 py-2 rounded-full bg-background/70 text-warning border border-warning/20 text-xs font-semibold">
                                Try again in {remainingCooldown}s
                            </div>
                        </div>
                    </div>
                    {/* Feedback list */}
                    <div className="rounded-lg border border-warning/10 bg-background p-3">
                        <p className="font-semibold text-md text-foreground mb-2">What to review</p>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                            {result.feedback.map((f) => (
                                <li key={f.id} className={f.correct ? "text-success font-medium" : "text-warning font-medium"}>
                                    {f.feedback}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            className="px-3 py-2 bg-background rounded-lg border border-primary/30 text-primary hover:bg-primary/10 inline-flex items-center gap-2"
                            onClick={onReviewDoc}
                        >
                            <ArrowUpRight className="h-4 w-4" />
                            Review document
                        </button>
                        <button
                            className="px-3 py-2 bg-background rounded-lg border border-primary/30 text-primary hover:bg-primary/10 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <div key={q.id} className="rounded-b-lg border-t-2 border-primary/70 ring-1 ring-border p-4 shadow-md bg-background">
                                <p className="font-semibold text-foreground mb-3">
                                    {idx + 1}. {q.prompt}
                                </p>
                                <div className="space-y-2 bg-surface-subtle/50 rounded-lg">
                                    {q.options.map((opt, optIdx) => {
                                        const selected = answers[q.id] === optIdx;
                                        return (
                                            <label
                                                key={optIdx}
                                                className={`flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer transition ${selected
                                                    ? "border-primary bg-primary/10"
                                                    : "border-transparent hover:bg-muted"
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    className="mt-1 cursor-pointer accent-primary"
                                                    name={q.id}
                                                    value={optIdx}
                                                    checked={selected}
                                                    onChange={() => onAnswerChange(q.id, optIdx)}
                                                    disabled={remainingCooldown > 0}
                                                />
                                                <span className={`text-sm ${selected ? "text-primary/80" : "text-foreground/90 font-medium"} `}>{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Passed banner */}
                    {result?.passed && (
                        <div className="rounded-xl border border-success/20 bg-success/10 text-success px-4 py-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-semibold">Passed</span>
                            </div>
                            <p className="text-sm mt-1">Score {result.score}% (need {result.required_score}%)</p>
                            <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                                {result.feedback.map((f) => (
                                    <li key={f.id} className="text-success">{f.feedback}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Submit row */}
                    <div className="flex items-center justify-between">
                        {remainingCooldown > 0 ? (
                            <div className="flex items-center gap-2 text-sm text-foreground/90">
                                <Timer className="h-4 w-4" />
                                <span>Try again in {remainingCooldown}s</span>
                            </div>
                        ) : (
                            <div />
                        )}
                        <button
                            className="px-7 py-2 bg-primary font-semibold text-white rounded-lg hover:bg-primary/80 transition disabled:opacity-60 cursor-pointer"
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
