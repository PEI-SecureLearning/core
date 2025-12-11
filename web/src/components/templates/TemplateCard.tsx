import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Template } from "./types";

interface Props {
  template: Template;
  excerpt: string;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}

export function TemplateCard({ template, excerpt, onPreview, onEdit, onDelete, deleting }: Props) {
  const updated = new Date(template.updated_at).toLocaleString();

  return (
    <Card className="bg-white/90 hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          {template.name}
        </CardTitle>
        <CardDescription className="text-slate-600">{template.subject}</CardDescription>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {template.category && (
            <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700 border border-purple-100">
              {template.category}
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1">{updated}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        {template.description && <p className="text-slate-600">{template.description}</p>}
        <p className="text-slate-500 leading-relaxed">
          {excerpt}
          {excerpt.length === 140 && "…"}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onPreview}>
            <Eye size={16} />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil size={16} />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-rose-600"
            onClick={onDelete}
            disabled={deleting}
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
        <span className="text-xs text-slate-500">
          Updated {new Date(template.updated_at).toLocaleDateString()}
        </span>
      </CardFooter>
    </Card>
  );
}
