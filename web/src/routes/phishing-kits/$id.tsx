import { createFileRoute } from "@tanstack/react-router";
import PhishingKitEditPage from "@/components/phishing-kits/PhishingKitEditPage";

export const Route = createFileRoute("/phishing-kits/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <PhishingKitEditPage kitId={Number(id)} />;
}
