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

export const Route = createFileRoute("/campaigns/new-campaign")({
  component: RouteComponent,
});

interface StepConfig {
  name: string;
  label: string;
  component: ComponentType<unknown>;
}

function CampaignStepper() {
  const { getPayload, isValid } = useCampaign();
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

  const handleCreateCampaign = async () => {
    if (!isValid()) {
      toast.error(
        "Campaign data is incomplete. Please fill in all required fields."
      );
      return;
    }

    const payload = getPayload();
    if (!payload) {
      toast.error("Failed to create campaign payload");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/realms/${realm}/campaigns`, {
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
    } catch (error) {
      console.error("Failed to create campaign:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create campaign"
      );
    }
  };

  return (
    <Stepper
      initialStep={1}
      onStepChange={(step) => console.log("Step:", step)}
      onFinalStepCompleted={handleCreateCampaign}
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
  const { keycloak } = useKeycloak();

  const creatorId = useMemo(() => {
    return (keycloak.tokenParsed as { sub?: string } | undefined)?.sub ?? null;
  }, [keycloak.tokenParsed]);

  return (
    <div className="size-full p-6 bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <CampaignProvider creatorId={creatorId ?? undefined}>
        <CampaignStepper />
      </CampaignProvider>
    </div>
  );
}
