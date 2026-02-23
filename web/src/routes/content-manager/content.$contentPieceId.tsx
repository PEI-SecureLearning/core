import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/content-manager/content/$contentPieceId")({
  beforeLoad: () => {
    throw redirect({ to: "/content-manager/content" });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
