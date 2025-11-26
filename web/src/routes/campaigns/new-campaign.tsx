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

  return (
    <div className="size-full px-15 py-5">
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
