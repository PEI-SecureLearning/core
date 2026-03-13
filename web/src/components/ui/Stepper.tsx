import React, {
  useState,
  Children,
  useRef,
  useLayoutEffect,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  onBeforeComplete?: () => Promise<boolean> | boolean;
  validateStep?: (step: number) => boolean;
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
  onStepChange = () => { },
  onFinalStepCompleted = () => { },
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
  renderStepIndicator,
}: Readonly<StepperProps>) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
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

  const handleNext = () => {
    if (!isLastStep) {
      // Validate current step before advancing
      if (validateStep && !validateStep(currentStep)) {
        return;
      }
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    // If there's a beforeComplete callback, wait for it
    if (onBeforeComplete) {
      const canComplete = await onBeforeComplete();
      if (!canComplete) {
        return; // Stay on current step
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
      <div
        className="size-full rounded-2xl flex flex-col justify-start  align-middle overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 8px 32px rgba(147, 51, 234, 0.08)'
        }}
      >
        {/* Step Indicators */}
        <div
          className={`${stepContainerClassName} w-full border-b border-border/40 px-8 py-6`}
          style={{ background: 'rgba(255, 255, 255, 0.4)' }}
        >
          <div className="mx-auto flex w-full max-w-4xl items-center justify-center">
            {stepsArray.map((_, index) => {
              const stepNumber = index + 1;
              const isNotLastStep = index < totalSteps - 1;

              // Handler that validates all steps before jumping
              const handleStepClick = (clicked: number) => {
                // Allow going back without validation
                if (clicked < currentStep) {
                  setDirection(-1);
                  updateStep(clicked);
                  return;
                }
                // For jumping forward, validate all steps in between
                if (validateStep) {
                  for (let step = currentStep; step < clicked; step++) {
                    if (!validateStep(step)) {
                      return; // Stop at first invalid step
                    }
                  }
                }
                setDirection(1);
                updateStep(clicked);
              };

              return (
                <React.Fragment key={stepNumber}>
                  {renderStepIndicator ? (
                    renderStepIndicator({
                      step: stepNumber,
                      currentStep,
                      onStepClick: handleStepClick,
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
                    <StepConnector
                      isComplete={currentStep > stepNumber}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-muted/30">
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
            className={`px-8 py-5 border-t border-border/40 ${footerClassName}`}
            style={{ background: 'rgba(255, 255, 255, 0.4)' }}
          >
            <div
              className={`flex ${currentStep > 1 ? "justify-between" : "justify-end"} items-center`}
            >
              {currentStep !== 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-normal text-muted-foreground transition-all duration-150 hover:bg-muted/60"
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(148, 163, 184, 0.2)'
                  }}
                  {...backButtonProps}
                >
                  <ChevronLeft size={16} />
                  {backButtonText}
                </button>
              )}
              <button
                onClick={isLastStep ? handleComplete : handleNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 14px rgba(147, 51, 234, 0.25)'
                }}
                {...nextButtonProps}
              >
                {isLastStep ? "Complete" : nextButtonText}
                {!isLastStep && <ChevronRight size={16} />}
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
  className = "",
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
  onHeightReady,
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
    opacity: 0,
  }),
  center: {
    x: "0px",
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? "-40px" : "40px",
    opacity: 0,
  }),
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
  isWarning = false,
}: StepIndicatorProps) {
  let status: StepStatus = "complete";
  if (currentStep === step) {
    status = "active";
  } else if (currentStep < step) {
    status = "inactive";
  } else if (isWarning) {
    // Keep "warning" visually identical to inactive while preventing completed visuals.
    status = "warning";
  }

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  const StepIcon = stepIcon;
  const CompletedStepIcon = completedStepIcon;

  const indicatorContent: ReactNode = (() => {
    if (status === "complete") {
      return CompletedStepIcon ? (
        <CompletedStepIcon className="h-5 w-5 text-white" strokeWidth={2.3} />
      ) : (
        <Check className="h-5 w-5 text-white" strokeWidth={2.5} />
      );
    }

    if (StepIcon) {
      return (
        <StepIcon
          className={status === "active" ? "h-5 w-5 text-white" : "h-5 w-5 text-slate-400"}
          strokeWidth={2.2}
        />
      );
    }

    return (
      <span className={status === "active" ? "text-white" : "text-muted-foreground/70"}>{step}</span>
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
          inactive: {
            scale: 1,
            backgroundColor: "rgba(241, 245, 249, 0.8)",
            borderColor: "rgba(203, 213, 225, 0.6)",
          },
          warning: {
            scale: 1,
            backgroundColor: "rgba(241, 245, 249, 0.8)",
            borderColor: "rgba(203, 213, 225, 0.6)",
          },
          active: {
            scale: 1,
            backgroundColor: "#a855f7",
            borderColor: "#a855f7",
          },
          complete: {
            scale: 1,
            backgroundColor: "#9333ea",
            borderColor: "#9333ea",
          },
        }}
        transition={{ duration: 0.2 }}
        className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-[14px] border-2"
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
  const color = "#9333ea";

  return (
    <div className="relative mx-4 h-0.5 flex-1 overflow-hidden rounded-full bg-muted/60">
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full"
        initial={false}
        animate={{
          width: isComplete ? "100%" : "0%",
          backgroundColor: isComplete ? color : "transparent"
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}
