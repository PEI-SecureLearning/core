import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/campaigns/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <div>Hello "/campaigns/"!</div>
      <br />
      <Link to="/campaigns/new-campaign">New Campaign</Link>
    </>
  );
}
