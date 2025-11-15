import { createFileRoute } from "@tanstack/react-router";
import UserGroupsPage from "../../Pages/user-groups";

export const Route = createFileRoute("/usergroups/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <UserGroupsPage />;
}
