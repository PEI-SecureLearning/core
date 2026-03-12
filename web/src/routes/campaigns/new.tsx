import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type ComponentType } from "react";
import { useKeycloak } from "@react-keycloak/web";
import CampaignForms from "@/components/campaigns/new-campaign/CampaignForms";
import SendingProfilePicker from "@/components/campaigns/new-campaign/SendingProfilePicker";
import PhishingKitPicker from "@/components/campaigns/new-campaign/PhishingKitPicker";
import TargetGroupSelector from "@/components/campaigns/new-campaign/TargetGroupSelector";
import CampaignScheduler from "@/components/campaigns/new-campaign/CampaignScheduler";
import Stepper, { Step } from "@/components/ui/Stepper";
import {
  CampaignProvider,
  useCampaign,
} from "@/components/campaigns/new-campaign/CampaignContext";
import { toast } from "sonner";
import { z } from "zod";

const API_BASE = import.meta.env.VITE_API_URL;

export const Route = createFileRoute("/campaigns/new")({
  validateSearch: z.object({
    groupId: z.string().optional(),
  }),
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

  // Step 2 shows a warning when no sending profiles are selected
  const stepWarnings = data.sending_profile_ids.length === 0 ? [2] : [];

  const steps: StepConfig[] = [
    { name: "forms", label: "Basic Info", component: CampaignForms },
    {
      name: "sending-profiles",
      label: "Sending Profiles",
      component: SendingProfilePicker,
    },
    {
      name: "phishing-kits",
      label: "Phishing Kits",
      component: PhishingKitPicker,
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
      case 2: // Sending Profiles (not mandatory)
        return true;
      case 3: // Phishing Kits
        if (data.phishing_kit_ids.length === 0) {
          toast.error("Please select at least one phishing kit.");
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
          : "Campaign data is incomplete. Please fill in all required fields.",
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
        error instanceof Error ? error.message : "Failed to create campaign",
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
      stepWarnings={stepWarnings}
    >
      {steps.map((s) => (
        <Step key={s.name}>
          <s.component />
        </Step>
      ))}
    </Stepper>
  );
}

function RouteComponent() {
  const { groupId } = Route.useSearch();
  const initialGroupIds = groupId ? [groupId] : [];

  return (
    <div className="size-full p-6 bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <CampaignProvider initialGroupIds={initialGroupIds}>
        <CampaignStepper />
      </CampaignProvider>
    </div>
  );
}
