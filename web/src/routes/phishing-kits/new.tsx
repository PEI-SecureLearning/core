import { createFileRoute } from "@tanstack/react-router";
import PhishingKitForm from "@/components/phishing-kits/PhishingKitForm";

export const Route = createFileRoute("/phishing-kits/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <PhishingKitForm />;
}
