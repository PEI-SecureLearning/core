import NewSendingProfile from "@/components/sending-profiles/NewSendingProfile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sending-profiles/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <NewSendingProfile />;
}
