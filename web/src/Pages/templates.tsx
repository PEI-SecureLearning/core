import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Plus, Eye, Layout } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import DisplayModeToggle from "@/components/shared/DisplayModeToggle";
import SearchBar from "@/components/shared/SearchBar";
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
    template.subject,
    template.description,
    template.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
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
  const [form, setForm] = useState(initialTemplateForm);
  const [activeTab, setActiveTab] = useState<(typeof templatePaths)[number]>("/templates/emails/");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const templates = useMemo(() => data ?? [], [data]);
  const { keycloak } = useKeycloak();
  const userRoles = keycloak.tokenParsed?.realm_access?.roles ?? [];
  const isContentManager = userRoles.includes('CONTENT_MANAGER');
  const grouped = useMemo(() => {
    return templates.reduce<Record<string, Template[]>>((acc, t) => {
      if (!acc[t.path]) acc[t.path] = [];
      acc[t.path].push(t);
      return acc;
    }, { "/templates/emails/": [], "/templates/pages/": [] });
  }, [templates]);

  const filteredGrouped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return grouped;

    return Object.fromEntries(
      Object.entries(grouped).map(([path, bucket]) => [
        path,
        bucket.filter((template) => templateMatchesQuery(template, q)),
      ]),
    ) as Record<string, Template[]>;
  }, [grouped, searchQuery]);

  const renderTemplateCard = (template: Template, isEmail: boolean) => {
    if (viewMode === "table") {
      return (
        <div
          key={template.id}
          className="flex items-center gap-3 px-4 py-3 rounded-md border border-border bg-background"
        >
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            {isEmail ? (
              <Eye className="h-4 w-4 text-primary" />
            ) : (
              <Layout className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {template.subject || template.description || "No description"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Updated {new Date(template.updated_at).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-8 text-xs shrink-0"
            onClick={() => setPreviewId(template.id)}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        </div>
      );
    }

    if (isEmail) {
      return (
        <div
          key={template.id}
          className="relative border-2 rounded-lg bg-background overflow-hidden transition-all duration-200 text-left w-full hover:border-primary/50 hover:shadow-sm border-border"
        >
          <div className="border-b border-border/50 bg-muted/20 px-3 py-2.5">
            <p className="text-sm font-medium text-foreground truncate pr-8">{template.name}</p>
          </div>
          <div className="p-3">
            {template.subject && template.subject !== template.name && (
              <p className="text-xs text-primary/80 truncate">{template.subject}</p>
            )}
            {template.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {template.description}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">
              Updated {new Date(template.updated_at).toLocaleDateString()}
            </p>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => setPreviewId(template.id)}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={template.id}
        className="relative border-2 rounded-lg bg-background overflow-hidden transition-all duration-200 text-left w-full hover:border-primary/50 hover:shadow-sm border-border group"
      >
        <div className="w-full h-32 bg-muted/30 border-b border-border/50 relative overflow-hidden">
          {template.html ? (
            <iframe
              title={`thumb-${template.id}`}
              srcDoc={template.html}
              sandbox=""
              className="pointer-events-none"
              style={{
                width: "200%",
                height: "200%",
                transform: "scale(0.5)",
                transformOrigin: "top left",
                border: 0,
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Layout className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          <button
            type="button"
            onClick={() => setPreviewId(template.id)}
            className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-background/90 border border-border/60 text-xs text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:text-foreground"
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
          {template.subject && template.subject !== template.name && (
            <p className="text-xs text-primary/80 truncate mt-0.5">{template.subject}</p>
          )}
          {template.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">
            Updated {new Date(template.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  };

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

  const openCreateModal = () => {
    setForm({ ...initialTemplateForm, path: activeTab });
    setShowForm(true);
  };

  const saveTemplate = () => {
    createTemplate.mutate();
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 pt-8 pb-8 space-y-6 bg-background">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Phishing templates</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pull campaign-ready HTML straight from the template store.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isContentManager && (
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
      {showForm && isContentManager && (
        <TemplateFormModal
          showForm={showForm}
          editingTemplate={null}
          form={form}
          setForm={setForm}
          onClose={() => setShowForm(false)}
          onSave={saveTemplate}
          isSaving={createTemplate.isPending}
        />
      )}

      {!isLoading && !isError && (
        <>
          {templates.length === 0 ? (
            <EmptyState />
          ) : (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof templatePaths)[number])}>
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
                    { value: "grid", ariaLabel: "Grid view", icon: "grid" },
                  ]}
                />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  className="h-10 w-10 shrink-0 rounded-full border-slate-200/60 bg-white/70"
                  disabled={isFetching}
                  title="Refresh"
                >
                  <RefreshCcw
                    size={16}
                    className={cn("transition", isFetching && "animate-spin")}
                  />
                </Button>
              </div>

              {templatePaths.map((pathKey) => {
                const bucket = filteredGrouped[pathKey] || [];
                const isEmail = pathKey === "/templates/emails/";
                return (
                  <TabsContent key={pathKey} value={pathKey} className="mt-6 space-y-3">
                    {bucket.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        {searchQuery.trim()
                          ? "No templates match your search."
                          : "No templates in this section yet."}
                      </div>
                    ) : (
                      <div className={cn(
                        "gap-4",
                        viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3" : "space-y-2",
                      )}>
                        {bucket.map((template) => renderTemplateCard(template, isEmail))}
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
        <TemplatePreviewModal template={previewTemplate} onClose={() => setPreviewId(null)} />
      )}
    </div>
  );
}