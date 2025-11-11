import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campaigns/new-campaign")({
  component: RouteComponent,
});

function RouteComponent() {
  const steps = ["Basic Info", "Targeting", "Budget", "Review"];
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () =>
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-50 py-10 px-6">
      {/* Step Pipeline */}
      <div className="flex items-center justify-center mb-12 w-full max-w-5xl">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center">
            {/* Step Badge + Title */}
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                i <= currentStep
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-gray-200 text-gray-700 border-gray-300"
              )}
            >
              <span className="font-semibold">{i + 1}.</span>
              <span>{step}</span>
            </div>

            {/* Arrow Connector */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "text-3xl mx-6 transition-colors",
                  i < currentStep ? "text-purple-600" : "text-gray-300"
                )}
              >
                &#10230;
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step Title */}
      <h2 className="text-3xl font-semibold mb-8 text-purple-700">
        {steps[currentStep]}
      </h2>

      {/* Step Content Placeholder */}
      <div className="flex-1 flex items-center justify-center w-full max-w-2xl bg-white shadow-sm rounded-2xl border min-h-[300px]">
        <p className="text-gray-500">Content for “{steps[currentStep]}” step</p>
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
