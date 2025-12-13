import TemplatesPage from "@/Pages/templates";
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute("/templates")({
  component: TemplatesPage,
});
