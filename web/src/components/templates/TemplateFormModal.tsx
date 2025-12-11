import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Template } from "./types";

interface FormState {
  name: string;
  path: string;
  subject: string;
  category: string;
  description: string;
  html: string;
}

interface Props {
  showForm: boolean;
  editingTemplate: Template | null;
  form: FormState;
  setForm: (state: FormState) => void;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function TemplateFormModal({ showForm, editingTemplate, form, setForm, onClose, onSave, isSaving }: Props) {
  if (!showForm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {editingTemplate ? "Edit template" : "New template"}
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              {editingTemplate ? editingTemplate.name : "Add phishing template"}
            </h3>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-slate-600">
            Close
          </Button>
        </div>
        <div className="p-6 space-y-4 h-500px overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="space-y-1">
              <select
                className="h-10 w-full rounded-md border px-3 text-sm"
                value={form.path}
                onChange={(e) => setForm({ ...form, path: e.target.value })}
              >
                <option value="/templates/emails/">Email template</option>
                <option value="/templates/pages/">Landing page</option>
              </select>
            </div>
            <Input
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <Input
              placeholder="Category (optional)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="HTML content"
            className="h-500px overflow-y-auto"
            value={form.html}
            onChange={(e) => setForm({ ...form, html: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="gap-2"
            onClick={onSave}
            disabled={
              isSaving ||
              !form.name.trim() ||
              !form.subject.trim() ||
              !form.html.trim()
            }
          >
            {isSaving ? "Saving..." : "Save template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
