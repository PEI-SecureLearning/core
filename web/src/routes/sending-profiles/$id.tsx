import { createFileRoute } from "@tanstack/react-router";
import EditSendingProfile from "@/components/sending-profiles/id/EditSendingProfile";

export const Route = createFileRoute("/sending-profiles/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <EditSendingProfile />;
}
