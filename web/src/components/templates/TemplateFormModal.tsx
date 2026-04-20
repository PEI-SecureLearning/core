import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import FormTooltip from "@/components/shared/FormTooltip";
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

  const isEmail = form.path === "/templates/emails/";
  
  const hasRedirect = form.html.includes("${{redirect}}");
  const hasPixel = form.html.includes("${{pixel}}");
  
  let validationError: string | null = null;
  if (isEmail) {
    if (!hasRedirect || !hasPixel) {
      validationError = "Email templates must include both ${{redirect}} and ${{pixel}} variables.";
    }
  } else {
    if (!hasRedirect) {
      validationError = "Landing page templates must include the ${{redirect}} variable.";
    }
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.html.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (isEmail && !form.subject.trim()) {
      toast.error("Email templates must have a subject line.");
      return;
    }
    if (validationError) {
      toast.error(validationError);
      return;
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-background shadow-2xl overflow-hidden border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {editingTemplate ? "Edit template" : "New template"}
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {editingTemplate ? editingTemplate.name : "Add phishing template"}
            </h3>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Close
          </Button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
              <Input
                placeholder="e.g., Q3 Password Expiry Notice"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type <span className="text-destructive">*</span></label>
              <select
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.path}
                onChange={(e) => setForm({ ...form, path: e.target.value })}
              >
                <option value="/templates/emails/">Email template</option>
                <option value="/templates/pages/">Landing page</option>
              </select>
            </div>

            {isEmail && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Subject <span className="text-destructive">*</span></label>
                <Input
                  placeholder="e.g., Action Required: Update Your password"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Input
                placeholder="e.g., Credential Harvesting"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="e.g., Simulates a standard IT password expiration email."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">HTML Content <span className="text-destructive">*</span></label>
              <FormTooltip 
                side="right" 
                content={
                  isEmail 
                    ? ["Email templates must contain ${{redirect}} (to redirect the user to the simulation page) and ${{pixel}} (to inject a tracking pixel into the email)."]
                    : ["Landing page templates must contain ${{redirect}} (to redirect the user after the simulated interaction)."]
                }
              />
            </div>
            <Textarea
              placeholder={isEmail ? "<html>... ${{redirect}} ... ${{pixel}} ...</html>" : "<html>... ${{redirect}} ...</html>"}
              className="min-h-[200px] h-[200px] resize-y font-mono text-sm"
              value={form.html}
              onChange={(e) => setForm({ ...form, html: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-surface-subtle">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
