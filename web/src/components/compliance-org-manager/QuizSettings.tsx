type QuizSettingsProps = {
    questionCount: number;
    passingScore: number;
    maxQuestionCount: number;
    possiblePassingScores: number[];
    onQuestionCountChange: (delta: 1 | -1) => void;
    onPassingScoreChange: (delta: 1 | -1) => void;
};

function TooltipIcon({ text }: { text: string }) {
    return (
        <div className="relative group">
            <span className="h-5 w-5 rounded-full border border-purple-600 text-xs text-purple-700 flex items-center justify-center cursor-default">
                ?
            </span>
            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-md bg-gray-50 border border-purple-600 px-3 py-2 text-xs text-gray-700 opacity-0 transition-opacity group-hover:opacity-100">
                {text}
            </div>
        </div>
    );
}

function StepperButton({
    onClick,
    disabled,
    label,
    variant = "outline",
    children,
}: {
    onClick: () => void;
    disabled: boolean;
    label: string;
    variant?: "outline" | "filled";
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            className={`h-8 w-12 rounded-md text-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${variant === "filled"
                ? "bg-purple-700 text-white hover:bg-purple-800"
                : "border border-gray-200 text-gray-700 hover:bg-gray-50"
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
    onPassingScoreChange,
}: QuizSettingsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-x-3 place-items-center">
            {/* Questions per quiz */}
            <div className="w-full max-w-xs">
                <div className="flex items-center justify-center gap-2">
                    <label htmlFor="question-count" className="text-base font-semibold text-gray-800">
                        Questions per quiz
                    </label>
                    <TooltipIcon text="Number of questions (randomly selected from the bank) to be asked per quiz." />
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
                        className="bg-white h-12 min-w-[80px] rounded-md border border-gray-200 text-gray-900 flex items-center justify-center text-base font-semibold"
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
                    <label htmlFor="passing-score" className="text-base font-semibold text-gray-800">
                        Passing score (%)
                    </label>
                    <TooltipIcon text="Percentage required to pass the quiz." />
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
                        className="h-12 min-w-[80px] rounded-md border border-gray-200 text-gray-900 flex items-center justify-center text-base font-semibold"
                    >
                        {passingScore}%
                    </div>
                    <StepperButton
                        onClick={() => onPassingScoreChange(1)}
                        disabled={possiblePassingScores.indexOf(passingScore) >= possiblePassingScores.length - 1}
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
