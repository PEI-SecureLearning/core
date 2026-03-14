import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type ComponentType } from "react";
import { useKeycloak } from "@react-keycloak/web";
import {
  BookOpen,
  BookOpenCheck,
  Calendar,
  CalendarCheck2,
  MailCheck,
  Mail,
  PackageCheck,
  Package,
  UserRoundCheck,
  UserRound
} from "lucide-react";
import CampaignForms from "@/components/campaigns/new-campaign/CampaignForms";
import SendingProfilePicker from "@/components/campaigns/new-campaign/SendingProfilePicker";
import PhishingKitPicker from "../../components/campaigns/new-campaign/PhishingKitPicker";
import TargetGroupSelector from "../../components/campaigns/new-campaign/TargetGroupSelector";
import CampaignScheduler from "@/components/campaigns/new-campaign/CampaignScheduler";
import Stepper, { Step } from "@/components/ui/Stepper";
import {
  CampaignProvider,
  useCampaign
} from "@/components/campaigns/new-campaign/CampaignContext";
import { toast } from "sonner";
import { z } from "zod";

const API_BASE = import.meta.env.VITE_API_URL;

export const Route = createFileRoute("/campaigns/new")({
  validateSearch: z.object({
    groupId: z.string().optional()
  }),
  component: RouteComponent
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

  const steps: StepConfig[] = [
    { name: "forms", label: "Basic Info", component: CampaignForms },
    {
      name: "target-groups",
      label: "Target Groups",
      component: TargetGroupSelector
    },
    {
      name: "phishing-kits",
      label: "Phishing Kits",
      component: PhishingKitPicker
    },
    {
      name: "sending-profiles",
      label: "Sending Profiles",
      component: SendingProfilePicker
    },
    {
      name: "schedule",
      label: "Review",
      component: CampaignScheduler
    }
  ];

  const stepIcons = [BookOpen, UserRound, Package, Mail, Calendar] as const;
  const stepCompletedIcons = [
    BookOpenCheck,
    UserRoundCheck,
    PackageCheck,
    MailCheck,
    CalendarCheck2
  ] as const;
  const sendingProfilesStepIndex =
    steps.findIndex((step) => step.name === "sending-profiles") + 1;
  const stepWarnings =
    data.sending_profile_ids.length === 0 && sendingProfilesStepIndex > 0
      ? [sendingProfilesStepIndex]
      : [];

  // Validate each step before allowing to proceed
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        if (!data.name.trim()) {
          toast.error("Campaign name is required.");
          return false;
        }
        return true;
      case 2: // Target Groups
        if (data.user_group_ids.length === 0) {
          toast.error("Please select at least one target group.");
          return false;
        }
        return true;
      case 3: // Phishing Kits
        if (data.phishing_kit_ids.length === 0) {
          toast.error("Please select at least one phishing kit.");
          return false;
        }
        return true;
      case 4: // Sending Profiles (not mandatory)
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
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : ""
        },
        body: JSON.stringify(payload)
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
      stepIcons={stepIcons}
      stepCompletedIcons={stepCompletedIcons}
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
    <div className="size-full p-6 bg-background ">
      <CampaignProvider initialGroupIds={initialGroupIds}>
        <CampaignStepper />
      </CampaignProvider>
    </div>
  );
}
