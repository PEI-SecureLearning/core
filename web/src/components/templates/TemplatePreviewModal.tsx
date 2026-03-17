import { Button } from "@/components/ui/button";
import type { Template } from "./types";

interface Props {
  template: Template;
  onClose: () => void;
}

export function TemplatePreviewModal({ template, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl rounded-2xl bg-background shadow-2xl overflow-hidden border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">HTML preview</p>
            <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
            <p className="text-sm text-muted-foreground">{template.subject}</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Close
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-auto bg-surface-subtle">
          <iframe
            title={`preview-${template.id}`}
            srcDoc={template.html}
            sandbox=""
            className="w-full h-[70vh] bg-background border-0"
          />
        </div>
      </div>
    </div>
  );
}
