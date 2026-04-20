import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/campaigns/$id")({
  component: RouteComponent
});

function RouteComponent() {
  return <Outlet />;
}
