import { createFileRoute } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CampaignForms from "@/components/campaigns/new-campaign/CampaignForms";
import StepCard from "@/components/campaigns/new-campaign/StepCard";
import EmailTemplatePicker from "@/components/campaigns/new-campaign/EmailTemplatePicker";
import LandingPageTemplatePicker from "@/components/campaigns/new-campaign/LandingPageTemplatePicker";
import TargetGroupSelector from "@/components/campaigns/new-campaign/TargetGroupSelector";
import CampaignScheduler from "@/components/campaigns/new-campaign/CampaignScheduler";
import Stepper, { Step } from "@/components/ui/Stepper";

export const Route = createFileRoute("/campaigns/new-campaign")({
  component: RouteComponent,
});

function RouteComponent() {
  interface Step {
    name: string;
    label: string;
    component: ComponentType<unknown>;
  }

  const steps: Step[] = [
    { name: "forms", label: "Basic Info", component: CampaignForms },
    {
      name: "email-template",
      label: "Email Template",
      component: EmailTemplatePicker,
    },
    {
      name: "page-template",
      label: "Landing Page",
      component: LandingPageTemplatePicker,
    },
    {
      name: "target-groups",
      label: "Target Groups",
      component: TargetGroupSelector,
    },
    {
      name: "schedule",
      label: "Schedule & Review",
      component: CampaignScheduler,
    },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const CurrentComponent = steps[currentStep].component;

  const nextStep = () =>
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div
      className="w-full max-h-full
     flex justify-center items-center align-middle "
    >
      <Stepper
        initialStep={1}
        onStepChange={(step) => console.log(step)}
        onFinalStepCompleted={() => console.log("completed")}
        backButtonText="Previous"
        nextButtonText="Next"
      >
        {steps.map((s, i) => (
          <Step key={i}>
            <s.component />
          </Step>
        ))}
      </Stepper>
    </div>
  );
}
