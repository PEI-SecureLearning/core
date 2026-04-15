import { createFileRoute } from "@tanstack/react-router";
import { UserDetailsPage } from "../../components/admin/tenant-org-manager/UserDetailsPage";

export const Route = createFileRoute("/users/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <UserDetailsPage />;
}