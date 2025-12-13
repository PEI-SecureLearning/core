import React, {
  useState,
  Children,
  useRef,
  useLayoutEffect,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  stepLabels?: string[];
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
  stepCircleContainerClassName = "",
  stepContainerClassName = "",
  contentClassName = "",
  footerClassName = "",
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = "Back",
  nextButtonText = "Continue",
  disableStepIndicators = false,
  stepLabels = [],
  renderStepIndicator,
  ...rest
}: StepperProps) {
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
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
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
        className="size-full rounded-2xl flex flex-col justify-center align-middle overflow-hidden"
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
          className={`${stepContainerClassName} flex items-center py-6 px-8 border-b border-slate-200/40`}
          style={{ background: 'rgba(255, 255, 255, 0.4)' }}
        >
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            const label = stepLabels[index] || `Step ${stepNumber}`;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: (clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    },
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    label={label}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={(clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                  />
                )}
                {isNotLastStep && (
                  <StepConnector isComplete={currentStep > stepNumber} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
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
            className={`px-8 py-5 border-t border-slate-200/40 ${footerClassName}`}
            style={{ background: 'rgba(255, 255, 255, 0.4)' }}
          >
            <div
              className={`flex ${currentStep !== 1 ? "justify-between" : "justify-end"} items-center`}
            >
              {currentStep !== 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-normal text-slate-600 transition-all duration-150 hover:bg-slate-100/60"
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
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = "",
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0);

  return (
    <motion.div style={{ position: "relative" }} className={className}>
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={(h) => setParentHeight(h)}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  children: ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
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
  children: ReactNode;
}

export function Step({ children }: StepProps) {
  return (
    <div className="w-full h-full flex flex-col items-center px-8 py-6">
      <div className="flex-1 px-1 max-w-2xl w-full min-h-0 overflow-auto">
        {children}
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  label: string;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
}

function StepIndicator({
  step,
  currentStep,
  label,
  onClickStep,
  disableStepIndicators = false,
}: StepIndicatorProps) {
  const status =
    currentStep === step
      ? "active"
      : currentStep < step
        ? "inactive"
        : "complete";

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

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
            borderColor: "rgba(203, 213, 225, 0.6)"
          },
          active: {
            scale: 1.05,
            backgroundColor: "rgba(147, 51, 234, 1)",
            borderColor: "rgba(147, 51, 234, 0.3)"
          },
          complete: {
            scale: 1,
            backgroundColor: "rgba(34, 197, 94, 1)",
            borderColor: "rgba(34, 197, 94, 0.3)"
          },
        }}
        transition={{ duration: 0.2 }}
        className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-[14px] border-2"
        style={{ boxShadow: status === 'active' ? '0 4px 14px rgba(147, 51, 234, 0.3)' : 'none' }}
      >
        {status === "complete" ? (
          <Check className="h-5 w-5 text-white" strokeWidth={2.5} />
        ) : status === "active" ? (
          <span className="text-white">{step}</span>
        ) : (
          <span className="text-slate-400">{step}</span>
        )}
      </motion.div>
      <motion.span
        className="text-[11px] font-normal whitespace-nowrap tracking-wide"
        variants={{
          inactive: { color: "rgb(148, 163, 184)" },
          active: { color: "rgb(147, 51, 234)" },
          complete: { color: "rgb(34, 197, 94)" },
        }}
      >
        {label}
      </motion.span>
    </motion.div>
  );
}

interface StepConnectorProps {
  isComplete: boolean;
}

function StepConnector({ isComplete }: StepConnectorProps) {
  return (
    <div className="relative mx-4 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200/60">
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full"
        initial={false}
        animate={{
          width: isComplete ? "100%" : "0%",
          backgroundColor: isComplete ? "rgb(34, 197, 94)" : "transparent"
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}
