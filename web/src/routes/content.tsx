import { createFileRoute } from "@tanstack/react-router";
import { ContentDashboard } from "@/components/content/ContentDashboard";

export const Route = createFileRoute("/content")({
  component: ContentDashboard,
});

