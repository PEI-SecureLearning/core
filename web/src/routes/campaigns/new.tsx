import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type ComponentType, useMemo } from "react";
import { useKeycloak } from "@react-keycloak/web";
import CampaignForms from "@/components/campaigns/new-campaign/CampaignForms";
import EmailTemplatePicker from "@/components/campaigns/new-campaign/EmailTemplatePicker";
import LandingPageTemplatePicker from "@/components/campaigns/new-campaign/LandingPageTemplatePicker";
import TargetGroupSelector from "@/components/campaigns/new-campaign/TargetGroupSelector";
import CampaignScheduler from "@/components/campaigns/new-campaign/CampaignScheduler";
import Stepper, { Step } from "@/components/ui/Stepper";
import {
  CampaignProvider,
  useCampaign,
} from "@/components/campaigns/new-campaign/CampaignContext";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const Route = createFileRoute("/campaigns/new")({
  component: RouteComponent,
});

interface StepConfig {
  name: string;
  label: string;
  component: ComponentType<unknown>;
}

function CampaignStepper() {
  const { data, getPayload, isValid, getValidationErrors } = useCampaign();
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const realm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

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

  // Validate each step before allowing to proceed
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        if (!data.name.trim()) {
          toast.error("Campaign name is required.");
          return false;
        }
        return true;
      case 2: // Email Template
        if (!data.email_template_id && !data.email_template) {
          toast.error("Please select an email template.");
          return false;
        }
        return true;
      case 3: // Landing Page
        if (!data.landing_page_template_id && !data.landing_page_template) {
          toast.error("Please select a landing page template.");
          return false;
        }
        return true;
      case 4: // Target Groups
        if (data.user_group_ids.length === 0) {
          toast.error("Please select at least one target group.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // Handle campaign creation - returns true if successful, false if error
  const handleBeforeComplete = async (): Promise<boolean> => {
    if (!isValid()) {
      const errors = getValidationErrors();
      toast.error(
        errors.length
          ? errors.join(" ")
          : "Campaign data is incomplete. Please fill in all required fields."
      );
      return false;
    }

    const payload = getPayload();
    if (!payload) {
      toast.error("Failed to create campaign payload");
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create campaign");
      }

      toast.success("Campaign created successfully!");
      navigate({ to: "/campaigns" });
      return true;
    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create campaign"
      );
      return false;
    }
  };

  return (
    <Stepper
      initialStep={1}
      onStepChange={(step) => console.log("Step:", step)}
      onBeforeComplete={handleBeforeComplete}
      validateStep={validateStep}
      backButtonText="Previous"
      nextButtonText="Next"
      stepLabels={steps.map((s) => s.label)}
    >
      {steps.map((s, i) => (
        <Step key={i}>
          <s.component />
        </Step>
      ))}
    </Stepper>
  );
}

function RouteComponent() {
  return (
    <div className="size-full p-6 bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <CampaignProvider>
        <CampaignStepper />
      </CampaignProvider>
    </div>
  );
}
