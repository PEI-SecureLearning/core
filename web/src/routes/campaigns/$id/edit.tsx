import CampaignEditPage from "@/Pages/campaign-edit";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/campaigns/$id/edit")({
    component: RouteComponent
});

function RouteComponent() {
    return <CampaignEditPage />;
}
