import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Template } from "./types";

interface Props {
  readonly template: Template;
  readonly excerpt: string;
  readonly onPreview: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly deleting: boolean;
}

export function TemplateCard({ template, excerpt, onPreview, onEdit, onDelete, deleting }: Props) {
  const updated = new Date(template.updated_at).toLocaleString();

  return (
    <Card className="bg-background/90 hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-foreground">
          {template.name}
        </CardTitle>
        <CardDescription className="text-muted-foreground">{template.subject}</CardDescription>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {template.category && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary border border-purple-100">
              {template.category}
            </span>
          )}
          <span className="rounded-full bg-muted px-3 py-1">{updated}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground/90">
        {template.description && <p className="text-muted-foreground">{template.description}</p>}
        <p className="text-muted-foreground leading-relaxed">
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
        <span className="text-xs text-muted-foreground">
          Updated {new Date(template.updated_at).toLocaleDateString()}
        </span>
      </CardFooter>
    </Card>
  );
}
