import { createFileRoute } from "@tanstack/react-router";
import SendingProfilesPage from "../../Pages/sending-profiles";

export const Route = createFileRoute("/sending-profiles/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SendingProfilesPage />;
}
