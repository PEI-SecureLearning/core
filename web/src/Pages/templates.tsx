import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Plus } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TemplateFormModal } from "@/components/templates/TemplateFormModal";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplatePreviewModal } from "@/components/templates/TemplatePreviewModal";
import { LoadingGrid } from "@/components/templates/LoadingGrid";
import { EmptyState } from "@/components/templates/EmptyState";
import { initialTemplateForm } from "@/components/templates/types";
import type { Template } from "@/components/templates/types";

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const pathLabels: Record<string, string> = {
  "/templates/emails/": "Email templates",
  "/templates/pages/": "Landing pages",
};

export default function TemplatesPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: () => apiClient.get<Template[]>("/templates"),
    staleTime: 30_000,
  });
  const qc = useQueryClient();

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState(initialTemplateForm);

  const templates = data ?? [];

  const grouped = useMemo(() => {
    return templates.reduce<Record<string, Template[]>>((acc, t) => {
      if (!acc[t.path]) acc[t.path] = [];
      acc[t.path].push(t);
      return acc;
    }, { "/templates/emails/": [], "/templates/pages/": [] });
  }, [templates]);

  const previewTemplate = useMemo(
    () => templates.find((t) => t.id === previewId),
    [previewId, templates],
  );

  const createTemplate = useMutation({
    mutationFn: () =>
      apiClient.post<Template>("/templates", {
        name: form.name,
        path: form.path,
        subject: form.subject,
        category: form.category || null,
        description: form.description || null,
        html: form.html,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setForm(initialTemplateForm);
      setShowForm(false);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: (id: string) =>
      apiClient.put<Template>(`/templates/${id}`, {
        name: form.name,
        path: form.path,
        subject: form.subject,
        category: form.category || null,
        description: form.description || null,
        html: form.html,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setEditingTemplate(null);
      setShowForm(false);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });

  const openCreateModal = () => {
    setEditingTemplate(null);
    setForm(initialTemplateForm);
    setShowForm(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      path: template.path,
      subject: template.subject,
      category: template.category || "",
      description: template.description || "",
      html: template.html,
    });
    setShowForm(true);
  };

  const saveTemplate = () => {
    if (editingTemplate) {
      updateTemplate.mutate(editingTemplate.id);
    } else {
      createTemplate.mutate();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-br from-slate-50 via-white to-purple-50/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Phishing templates</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Pull campaign-ready HTML straight from the template store. Managed in MongoDB, delivered dynamically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="inline-flex items-center gap-2" onClick={openCreateModal}>
            <Plus size={16} />
            Add template
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2"
            disabled={isFetching}
          >
            <RefreshCcw size={16} className={cn("transition", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && <LoadingGrid />}

      {showForm && (
        <TemplateFormModal
          showForm={showForm}
          editingTemplate={editingTemplate}
          form={form}
          setForm={setForm}
          onClose={() => setShowForm(false)}
          onSave={saveTemplate}
          isSaving={createTemplate.isPending || updateTemplate.isPending}
        />
      )}

      {!isLoading && !isError && (
        <>
          {templates.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-8">
              {["/templates/emails/", "/templates/pages/"].map((pathKey) => {
                const bucket = grouped[pathKey] || [];
                if (bucket.length === 0) return null;
                return (
                  <div key={pathKey} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      {pathLabels[pathKey] || pathKey}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {bucket.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onPreview={() => setPreviewId(template.id)}
                          onEdit={() => openEditModal(template)}
                          onDelete={() => deleteTemplate.mutate(template.id)}
                          deleting={deleteTemplate.isPending}
                          excerpt={stripHtml(template.html).slice(0, 140)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {previewTemplate && (
        <TemplatePreviewModal template={previewTemplate} onClose={() => setPreviewId(null)} />
      )}
    </div>
  );
}
