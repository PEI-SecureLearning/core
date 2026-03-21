import FormTooltip from "@/components/shared/FormTooltip";

type QuizSettingsProps = {
  questionCount: number;
  passingScore: number;
  maxQuestionCount: number;
  possiblePassingScores: number[];
  onQuestionCountChange: (delta: 1 | -1) => void;
  onPassingScoreChange: (delta: 1 | -1) => void;
};

function StepperButton({
  onClick,
  disabled,
  label,
  variant = "outline",
  children
}: Readonly<{
  onClick: () => void;
  disabled: boolean;
  label: string;
  variant?: "outline" | "filled";
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      className={`h-8 w-12 rounded-md text-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
        variant === "filled"
          ? "bg-primary text-white hover:bg-primary/80"
          : "border border-border text-foreground/90 hover:bg-surface-subtle"
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export default function QuizSettings({
  questionCount,
  passingScore,
  maxQuestionCount,
  possiblePassingScores,
  onQuestionCountChange,
  onPassingScoreChange
}: Readonly<QuizSettingsProps>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-x-3 place-items-center">
      {/* Questions per quiz */}
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-center gap-2">
          <label
            htmlFor="question-count"
            className="text-base font-semibold text-foreground"
          >
            Questions per quiz
          </label>
          <FormTooltip
            side="top"
            content={[
              "Number of questions (randomly selected from the bank) to be asked per quiz."
            ]}
          />
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <StepperButton
            onClick={() => onQuestionCountChange(-1)}
            disabled={questionCount <= 1}
            label="Decrease question count"
          >
            −
          </StepperButton>
          <div
            id="question-count"
            className="bg-background h-12 min-w-20 rounded-md border border-border text-foreground flex items-center justify-center text-base font-semibold"
          >
            {questionCount}
          </div>
          <StepperButton
            onClick={() => onQuestionCountChange(1)}
            disabled={questionCount >= maxQuestionCount}
            label="Increase question count"
            variant="filled"
          >
            +
          </StepperButton>
        </div>
      </div>

      {/* Passing score */}
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-center gap-2">
          <label
            htmlFor="passing-score"
            className="text-base font-semibold text-foreground"
          >
            Passing score (%)
          </label>
          <FormTooltip
            side="top"
            content={["Percentage required to pass the quiz."]}
          />
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <StepperButton
            onClick={() => onPassingScoreChange(-1)}
            disabled={possiblePassingScores.indexOf(passingScore) <= 0}
            label="Decrease passing score"
            data-testid="decrease-passing-score-btn"
          >
            −
          </StepperButton>
          <div
            id="passing-score"
            data-testid="passing-score-display"
            className="h-12 min-w-20 rounded-md border border-border text-foreground flex items-center justify-center text-base font-semibold"
          >
            {passingScore}%
          </div>
          <StepperButton
            onClick={() => onPassingScoreChange(1)}
            disabled={
              possiblePassingScores.indexOf(passingScore) >=
              possiblePassingScores.length - 1
            }
            label="Increase passing score"
            variant="filled"
          >
            +
          </StepperButton>
        </div>
      </div>
    </div>
  );
}
