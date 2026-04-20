import React, {
  useState,
  Children,
  useRef,
  useLayoutEffect,
  type HTMLAttributes,
  type ReactNode
} from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  type LucideIcon
} from "lucide-react";

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  onBeforeComplete?: () => Promise<boolean> | boolean;
  validateStep?: (step: number) => boolean | Promise<boolean>;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  stepIcons?: readonly LucideIcon[];
  stepCompletedIcons?: readonly LucideIcon[];
  stepWarnings?: readonly number[];
  renderStepIndicator?: (props: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => ReactNode;
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  onBeforeComplete,
  validateStep,
  stepContainerClassName = "",
  contentClassName = "",
  footerClassName = "",
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = "Back",
  nextButtonText = "Continue",
  disableStepIndicators = false,
  stepIcons = [],
  stepCompletedIcons = [],
  stepWarnings = [],
  renderStepIndicator
}: Readonly<StepperProps>) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
  const [isValidating, setIsValidating] = useState(false);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    if (!isLastStep) {
      if (validateStep) {
        setIsValidating(true);
        try {
          const isValid = await validateStep(currentStep);
          if (!isValid) return;
        } finally {
          setIsValidating(false);
        }
      }
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    if (onBeforeComplete) {
      const canComplete = await onBeforeComplete();
      if (!canComplete) {
        return;
      }
    }
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div className="flex items-center justify-center size-full animate-[fadeIn_0.4s_ease-out]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="size-full flex flex-col justify-start align-middle overflow-hidden bg-card shadow-sm">
        {/* Step Indicators */}
        <div
          className={`${stepContainerClassName} w-full border-b border-border px-8 py-6 bg-surface`}
        >
          <div className="mx-auto flex w-full max-w-4xl items-center justify-center">
            {stepsArray.map((_, index) => {
              const stepNumber = index + 1;
              const isNotLastStep = index < totalSteps - 1;

              // Only allow backward navigation via indicators
              const handleStepClick = (clicked: number) => {
                if (clicked < currentStep) {
                  setDirection(-1);
                  updateStep(clicked);
                }
              };

              return (
                <React.Fragment key={stepNumber}>
                  {renderStepIndicator ? (
                    renderStepIndicator({
                      step: stepNumber,
                      currentStep,
                      onStepClick: handleStepClick
                    })
                  ) : (
                    <StepIndicator
                      step={stepNumber}
                      stepIcon={stepIcons[index]}
                      completedStepIcon={stepCompletedIcons[index]}
                      disableStepIndicators={disableStepIndicators}
                      currentStep={currentStep}
                      onClickStep={handleStepClick}
                      isWarning={stepWarnings.includes(stepNumber)}
                    />
                  )}
                  {isNotLastStep && (
                    <StepConnector isComplete={currentStep > stepNumber} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-surface-subtle">
          <StepContentWrapper
            isCompleted={isCompleted}
            currentStep={currentStep}
            direction={direction}
            className={`h-full ${contentClassName}`}
          >
            {stepsArray[currentStep - 1]}
          </StepContentWrapper>
        </div>

        {/* Footer with Navigation */}
        {!isCompleted && (
          <div
            className={`px-8 py-5 border-t border-border bg-muted/20 ${footerClassName}`}
          >
            <div
              className={`flex ${currentStep > 1 ? "justify-between" : "justify-end"} items-center`}
            >
              {currentStep !== 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-normal text-muted-foreground transition-all duration-150 hover:bg-muted/60 bg-background border border-border"
                  {...backButtonProps}
                >
                  <ChevronLeft size={16} />
                  {backButtonText}
                </button>
              )}
              <button
                onClick={isLastStep ? handleComplete : handleNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium text-primary-foreground bg-primary transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                {...nextButtonProps}
                disabled={Boolean(nextButtonProps?.disabled) || isValidating}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    {isLastStep ? "Complete" : nextButtonText}
                    {!isLastStep && <ChevronRight size={16} />}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepContentWrapperProps {
  readonly isCompleted: boolean;
  readonly currentStep: number;
  readonly direction: number;
  readonly children: ReactNode;
  readonly className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = ""
}: StepContentWrapperProps) {
  return (
    <motion.div style={{ position: "relative" }} className={className}>
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={() => {}}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  readonly children: ReactNode;
  readonly direction: number;
  readonly onHeightReady: (height: number) => void;
}

function SlideTransition({
  children,
  direction,
  onHeightReady
}: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
    }
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ position: "absolute", inset: 0, height: "100%" }}
    >
      <div className="w-full h-full flex justify-center">{children}</div>
    </motion.div>
  );
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? "80px" : "-80px",
    opacity: 0
  }),
  center: {
    x: "0px",
    opacity: 1
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? "-40px" : "40px",
    opacity: 0
  })
};

interface StepProps {
  readonly children: ReactNode;
}

export function Step({ children }: StepProps) {
  return (
    <div className="w-full h-full flex flex-col items-center px-8 py-6">
      <div className="flex-1 px-1 max-w-5xl w-full min-h-0 overflow-auto">
        {children}
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  readonly step: number;
  readonly currentStep: number;
  readonly stepIcon?: LucideIcon;
  readonly completedStepIcon?: LucideIcon;
  readonly onClickStep: (clicked: number) => void;
  readonly disableStepIndicators?: boolean;
  readonly isWarning?: boolean;
}

type StepStatus = "active" | "inactive" | "complete" | "warning";

function StepIndicator({
  step,
  currentStep,
  stepIcon,
  completedStepIcon,
  onClickStep,
  disableStepIndicators = false,
  isWarning = false
}: StepIndicatorProps) {
  let status: StepStatus = "complete";
  if (currentStep === step) {
    status = "active";
  } else if (currentStep < step) {
    status = "inactive";
  } else if (isWarning) {
    status = "warning";
  }

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  const StepIcon = stepIcon;
  const CompletedStepIcon = completedStepIcon;

  const indicatorClassName = (() => {
    switch (status) {
      case "active":
      case "complete":
        return "bg-primary border-primary text-primary-foreground";
      case "warning":
      case "inactive":
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  })();

  const indicatorContent: ReactNode = (() => {
    if (status === "complete") {
      return CompletedStepIcon ? (
        <CompletedStepIcon
          className="h-5 w-5 text-primary-foreground"
          strokeWidth={2.3}
        />
      ) : (
        <Check className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      );
    }

    if (StepIcon) {
      return (
        <StepIcon
          className={
            status === "active"
              ? "h-5 w-5 text-primary-foreground"
              : "h-5 w-5 text-muted-foreground"
          }
          strokeWidth={2.2}
        />
      );
    }

    return (
      <span
        className={
          status === "active"
            ? "text-primary-foreground"
            : "text-muted-foreground"
        }
      >
        {step}
      </span>
    );
  })();

  return (
    <motion.div
      onClick={handleClick}
      className="relative cursor-pointer outline-none focus:outline-none flex flex-col items-center gap-2"
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1 },
          warning: { scale: 1 },
          active: { scale: 1 },
          complete: { scale: 1 }
        }}
        transition={{ duration: 0.2 }}
        className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-[14px] border-2 ${indicatorClassName}`}
      >
        {indicatorContent}
      </motion.div>
    </motion.div>
  );
}

interface StepConnectorProps {
  readonly isComplete: boolean;
}

function StepConnector({ isComplete }: Readonly<StepConnectorProps>) {
  return (
    <div className="relative mx-4 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full bg-primary"
        initial={false}
        animate={{
          width: isComplete ? "100%" : "0%"
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}
