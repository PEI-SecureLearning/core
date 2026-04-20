import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useKeycloak } from "@react-keycloak/web";
import {
  CampaignProvider,
  type CampaignCreatePayload
} from "@/components/campaigns/new-campaign/CampaignContext";
import CampaignStepperFlow from "@/components/campaigns/new-campaign/CampaignStepperFlow";
import { toast } from "sonner";
import { z } from "zod";

const API_BASE = import.meta.env.VITE_API_URL;

export const Route = createFileRoute("/campaigns/new")({
  validateSearch: z.object({
    groupId: z.string().optional()
  }),
  component: RouteComponent
});

function CampaignStepper() {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const handleCreateCampaign = async (
    payload: CampaignCreatePayload
  ): Promise<boolean> => {
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
    <CampaignStepperFlow
      onStepChange={(step) => console.log("Step:", step)}
      onSubmitPayload={handleCreateCampaign}
      backButtonText="Previous"
      nextButtonText="Next"
    />
  );
}

function RouteComponent() {
  const { groupId } = Route.useSearch();
  const initialGroupIds = groupId ? [groupId] : [];

  return (
    <div className="size-full bg-background ">
      <CampaignProvider initialGroupIds={initialGroupIds}>
        <CampaignStepper />
      </CampaignProvider>
    </div>
  );
}
