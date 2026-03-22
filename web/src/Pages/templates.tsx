import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { templateApi } from "@/services/templateApi";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import DisplayModeToggle from "@/components/shared/DisplayModeToggle";
import RefreshButton from "@/components/shared/RefreshButton";
import SearchBar from "@/components/shared/SearchBar";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateFormModal } from "@/components/templates/TemplateFormModal";
import { TemplatePreviewModal } from "@/components/templates/TemplatePreviewModal";
import { LoadingGrid } from "@/components/templates/LoadingGrid";
import { EmptyState } from "@/components/templates/EmptyState";
import { initialTemplateForm } from "@/components/templates/types";
import { useKeycloak } from "@react-keycloak/web";
import type { Template } from "@/components/templates/types";

const templatePaths = ["/templates/emails/", "/templates/pages/"] as const;
type ViewMode = "grid" | "table";

const templateMatchesQuery = (template: Template, query: string) => {
  const haystack = [
    template.name,
    template.description,
    template.category
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
};

export default function TemplatesPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<
    Template[]
  >({
    queryKey: ["templates"],
    queryFn: () => templateApi.getTemplates(),
    staleTime: 30_000
  });
  const qc = useQueryClient();

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState(initialTemplateForm);
  const [activeTab, setActiveTab] =
    useState<(typeof templatePaths)[number]>("/templates/emails/");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const templates = useMemo(() => data ?? [], [data]);
  const { keycloak } = useKeycloak();
  const userRoles = keycloak.tokenParsed?.realm_access?.roles ?? [];
  const isContentManager = userRoles.includes("content_manager") || userRoles.includes("CONTENT_MANAGER");
  const isOrgManager = userRoles.includes("org_manager") || userRoles.includes("ORG_MANAGER");
  const canManageTemplates = isContentManager || isOrgManager;
  const grouped = useMemo(() => {
    return templates.reduce<Record<string, Template[]>>(
      (acc, t) => {
        if (!acc[t.path]) acc[t.path] = [];
        acc[t.path].push(t);
        return acc;
      },
      { "/templates/emails/": [], "/templates/pages/": [] }
    );
  }, [templates]);

  const filteredGrouped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return grouped;

    return Object.fromEntries(
      Object.entries(grouped).map(([path, bucket]) => [
        path,
        bucket.filter((template) => templateMatchesQuery(template, q))
      ])
    ) as Record<string, Template[]>;
  }, [grouped, searchQuery]);

  const createTemplate = useMutation({
    mutationFn: () =>
      templateApi.createTemplate({
        name: form.name,
        path: form.path,
        subject: form.path === "/templates/emails/" ? form.subject : undefined,
        category: form.category || null,
        description: form.description || null,
        html: form.html
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setForm(initialTemplateForm);
      setShowForm(false);
      toast.success("Template created successfully");
    },
    onError: () => toast.error("Failed to create template")
  });

  const updateTemplate = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Template> }) =>
      templateApi.updateTemplate(data.id, data.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setForm(initialTemplateForm);
      setEditingTemplate(null);
      setShowForm(false);
      toast.success("Template updated successfully");
    },
    onError: () => toast.error("Failed to update template")
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => templateApi.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template deleted successfully");
    },
    onError: () => toast.error("Failed to delete template")
  });

  const openCreateModal = () => {
    setEditingTemplate(null);
    setForm({ ...initialTemplateForm, path: activeTab });
    setShowForm(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      path: template.path,
      subject: template.subject || "",
      category: template.category || "",
      description: template.description || "",
      html: template.html || ""
    });
    setShowForm(true);
  };

  const handleDelete = (template: Template) => {
    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      deleteTemplate.mutate(template.id);
    }
  };

  const previewTemplate = useMemo(
    () => templates.find((t) => t.id === previewId),
    [previewId, templates]
  );

  const saveTemplate = () => {
    if (editingTemplate) {
      updateTemplate.mutate({
        id: editingTemplate.id,
        payload: {
          name: form.name,
          path: form.path,
          subject: form.path === "/templates/emails/" ? form.subject : undefined,
          category: form.category || null,
          description: form.description || null,
          html: form.html
        }
      });
    } else {
      createTemplate.mutate();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 pt-8 pb-8 space-y-6 bg-background">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Phishing templates
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pull campaign-ready HTML straight from the template store.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManageTemplates && (
            <Button
              className="inline-flex items-center gap-2 text-white border-0 transition-colors bg-primary hover:bg-primary/90"
              onClick={openCreateModal}
            >
              <Plus size={16} />
              Add template
            </Button>
          )}
        </div>
      </div>

      {isLoading && <LoadingGrid />}

      {/* 3. Protect the Form Modal (prevent manual state triggering) */}
      {showForm && canManageTemplates && (
        <TemplateFormModal
          showForm={showForm}
          editingTemplate={editingTemplate}
          form={form}
          setForm={setForm}
          onClose={() => {
            setShowForm(false);
            setEditingTemplate(null);
            setForm(initialTemplateForm);
          }}
          onSave={saveTemplate}
          isSaving={editingTemplate ? updateTemplate.isPending : createTemplate.isPending}
        />
      )}

      {!isLoading && !isError && (
        <>
          {templates.length === 0 ? (
            <EmptyState />
          ) : (
            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as (typeof templatePaths)[number])}>
              <TabsList className="grid w-full grid-cols-2 border-b border-border rounded-none p-0" variant="line">
                <TabsTrigger
                  value="/templates/emails/"
                  className="rounded-none data-[state=active]:text-primary data-[state=active]:after:bg-primary"
                >
                  Email
                </TabsTrigger>
                <TabsTrigger
                  value="/templates/pages/"
                  className="rounded-none data-[state=active]:text-primary data-[state=active]:after:bg-primary"
                >
                  Landing Pages
                </TabsTrigger>
              </TabsList>

              <div className="mt-5 flex flex-row items-center gap-3">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search templates..."
                  className="grow"
                  iconClassName="text-primary"
                  inputClassName="h-10 rounded-md border-border/60"
                />

                <DisplayModeToggle
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { value: "table", ariaLabel: "Table view", icon: "table" },
                    { value: "grid", ariaLabel: "Grid view", icon: "grid" }
                  ]}
                />

                <RefreshButton
                  variant="outline"
                  size="icon"
                  onClick={() => void refetch()}
                  className="h-10 w-10 shrink-0 rounded-full border-slate-200/60 bg-white/70"
                  disabled={isFetching}
                  title="Refresh"
                  isRefreshing={isFetching}
                  label={null}
                />
              </div>

              {templatePaths.map((pathKey) => {
                const bucket = filteredGrouped[pathKey] || [];
                const isEmail = pathKey === "/templates/emails/";
                return (
                  <TabsContent
                    key={pathKey}
                    value={pathKey}
                    className="mt-6 space-y-3"
                  >
                    {bucket.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        {searchQuery.trim()
                          ? "No templates match your search."
                          : "No templates in this section yet."}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "gap-4",
                          viewMode === "grid"
                            ? "grid md:grid-cols-2 xl:grid-cols-3"
                            : "space-y-2"
                        )}
                      >
                        {bucket.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            isEmail={isEmail}
                            layout={viewMode === "grid" ? "grid" : "list"}
                            onPreview={() => setPreviewId(template.id)}
                            onEdit={canManageTemplates ? () => openEditModal(template) : undefined}
                            onDelete={canManageTemplates ? () => handleDelete(template) : undefined}
                            deleting={deleteTemplate.isPending}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </>
      )}

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
}
