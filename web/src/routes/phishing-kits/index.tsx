import { createFileRoute } from "@tanstack/react-router";
import PhishingKitsPage from "@/components/phishing-kits/PhishingKitsPage";

export const Route = createFileRoute("/phishing-kits/")(  {
  component: RouteComponent,
});

function RouteComponent() {
  return <PhishingKitsPage />;
}
