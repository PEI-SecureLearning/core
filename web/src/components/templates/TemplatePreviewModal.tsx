import { Button } from "@/components/ui/button";
import type { Template } from "./types";

interface Props {
  template: Template;
  onClose: () => void;
}

export function TemplatePreviewModal({ template, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">HTML preview</p>
            <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
            <p className="text-sm text-slate-600">{template.subject}</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-slate-600">
            Close
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-auto bg-slate-50">
          <iframe
            title={`preview-${template.id}`}
            srcDoc={template.html}
            sandbox=""
            className="w-full h-[70vh] bg-white border-0"
          />
        </div>
      </div>
    </div>
  );
}
