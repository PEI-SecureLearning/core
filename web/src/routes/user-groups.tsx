import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/user-groups")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/user-groups"!</div>;
}
