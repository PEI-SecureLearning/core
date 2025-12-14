import CampaignDetails from "@/Pages/campaign-details";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/campaigns/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CampaignDetails />;
}
