import type {
  QuizQuestionDraft,
  QuizQuestion,
  QuizSettings as QuizSettingsType
} from "./types";
import QuizQuestionCard from "./QuizQuestionCard";
import FormTooltip from "@/components/shared/FormTooltip";

type QuizEditorProps = {
  quizDraft: QuizQuestionDraft[];
  quizSettings: QuizSettingsType;
  quizUpdated: string;
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

function StepperRow({
  label,
  tooltip,
  displayValue,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled
}: Readonly<{
  label: string;
  tooltip: string;
  displayValue: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled: boolean;
  increaseDisabled: boolean;
}>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {label}
        </span>
        <FormTooltip side="top" iconSize={13} content={[tooltip]} />
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onDecrease}
          disabled={decreaseDisabled}
          className="h-7 w-7 rounded-md border border-border text-foreground/90 hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-base font-semibold flex items-center justify-center"
        >
          −
        </button>
        <span className="w-12 text-center text-sm font-semibold text-foreground tabular-nums">
          {displayValue}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={increaseDisabled}
          className="h-7 w-7 rounded-md bg-primary text-white hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-base font-semibold flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function QuizEditor({
  quizDraft,
  quizSettings,
  quizUpdated,
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
  onAddQuestion
}: Readonly<QuizEditorProps>) {
  return (
    <section className="flex flex-col w-96 shrink-0 min-h-0 overflow-hidden border border-border rounded-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Quiz</h2>
            <p className="text-xs text-muted-foreground">
              Last updated: {quizUpdated}
            </p>
          </div>
          <button
            data-testid="add-question-btn"
            className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-surface-subtle cursor-pointer"
            onClick={onAddQuestion}
          >
            + Add question
          </button>
        </div>

        {/* Compact settings */}
        <div className="space-y-2 pt-1">
          <StepperRow
            label="Questions per quiz"
            tooltip="Number of questions randomly selected from the bank per quiz."
            displayValue={String(quizSettings.question_count)}
            onDecrease={() => onQuestionCountChange(-1)}
            onIncrease={() => onQuestionCountChange(1)}
            decreaseDisabled={quizSettings.question_count <= 1}
            increaseDisabled={quizSettings.question_count >= maxQuestionCount}
          />
          <StepperRow
            label="Passing score"
            tooltip="Minimum percentage required to pass the quiz."
            displayValue={`${quizSettings.passing_score}%`}
            onDecrease={() => onPassingScoreChange(-1)}
            onIncrease={() => onPassingScoreChange(1)}
            decreaseDisabled={
              possiblePassingScores.indexOf(quizSettings.passing_score) <= 0
            }
            increaseDisabled={
              possiblePassingScores.indexOf(quizSettings.passing_score) >=
              possiblePassingScores.length - 1
            }
          />
        </div>
      </div>

      {/* Question cards */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {quizDraft.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No questions yet. Add one above.
          </p>
        )}
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
    </section>
  );
}
