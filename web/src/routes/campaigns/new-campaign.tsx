import { createFileRoute } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CampaignForms from "@/components/new-campaign/campaign-forms";
import StepCard from "@/components/new-campaign/step-card";

export const Route = createFileRoute("/campaigns/new-campaign")({
  component: RouteComponent,
});

function RouteComponent() {
  interface Step {
    name: string;
    label: string;
    component: ComponentType<unknown> | null;
  }

  const steps: Step[] = [
    { name: "forms", label: "Basic Info", component: CampaignForms },
    { name: "email-template", label: "Email Template", component: null },
    { name: "page-template", label: "Landing Page", component: null },
    { name: "target-groups", label: "Target Groups", component: null },
    { name: "schedule", label: "Schedule & Review", component: null },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const CurrentComponent = steps[currentStep].component;

  const nextStep = () =>
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="flex flex-col items-center w-full  bg-gray-50 py-10 px-6">
      {/* Step Pipeline */}
      <div className="flex items-center justify-center mb-12 w-full max-w-5xl gap-3">
        {steps.map((step, i) => (
          <div key={step.name} className="flex items-center gap-2">
            <StepCard index={i} label={step.label} active={i <= currentStep} />

            {/* Arrow Connector */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "text-3xl transition-colors",
                  i < currentStep ? "text-purple-500" : "text-gray-300"
                )}
              >
                &#10230;
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content Placeholder */}
      <div className="flex-1 flex items-center justify-center w-full max-w-3xl bg-white shadow-sm rounded-2xl border min-h-[300px]">
        {CurrentComponent ? <CurrentComponent /> : null}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between w-full max-w-2xl mt-10">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={nextStep}
          disabled={currentStep === steps.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
