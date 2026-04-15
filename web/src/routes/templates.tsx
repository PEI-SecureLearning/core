import TemplatesPage from "@/components/templates-page";
import { createFileRoute } from '@tanstack/react-router';


export const Route = createFileRoute("/templates")({
  component: TemplatesPage,
});
