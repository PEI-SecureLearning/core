import { createFileRoute } from "@tanstack/react-router";
import { UsersManagementPage } from "../../components/admin/tenant-org-manager/UsersManagementPage";

export const Route = createFileRoute("/users/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <UsersManagementPage />;
}