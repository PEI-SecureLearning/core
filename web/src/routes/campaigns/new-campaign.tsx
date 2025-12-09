import { createFileRoute } from "@tanstack/react-router";
import { type ComponentType } from "react";
import CampaignForms from "@/components/campaigns/new-campaign/CampaignForms";
import EmailTemplatePicker from "@/components/campaigns/new-campaign/EmailTemplatePicker";
import LandingPageTemplatePicker from "@/components/campaigns/new-campaign/LandingPageTemplatePicker";
import TargetGroupSelector from "@/components/campaigns/new-campaign/TargetGroupSelector";
import CampaignScheduler from "@/components/campaigns/new-campaign/CampaignScheduler";
import Stepper, { Step } from "@/components/ui/Stepper";

export const Route = createFileRoute("/campaigns/new-campaign")({
  component: RouteComponent,
});

interface StepConfig {
  name: string;
  label: string;
  component: ComponentType<unknown>;
}

function RouteComponent() {
  const steps: StepConfig[] = [
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
      label: "Review",
      component: CampaignScheduler,
    },
  ];

  return (
    <div className="size-full p-6 bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <Stepper
        initialStep={1}
        onStepChange={(step) => console.log("Step:", step)}
        onFinalStepCompleted={() => console.log("Campaign created!")}
        backButtonText="Previous"
        nextButtonText="Next"
        stepLabels={steps.map(s => s.label)}
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
