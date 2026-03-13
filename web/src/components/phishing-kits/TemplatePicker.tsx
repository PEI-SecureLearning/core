import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  LayoutGrid,
  List,
  Upload,
  Mail,
  Layout,
  Eye,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Template } from "@/components/templates/types";
import { TemplatePreviewModal } from "@/components/templates/TemplatePreviewModal";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

type ViewMode = "grid" | "list";

interface TemplatePickerProps {
  readonly templatePath: "/templates/emails/" | "/templates/pages/";
  readonly selectedId: string | null;
  readonly onSelect: (id: string, name: string) => void;
}

// ---------------------------------------------------------------------------
// Grid card
// ---------------------------------------------------------------------------
function TemplateGridCard({
  template,
  selected,
  onSelect,
  onPreview,
  DefaultIcon,
  isEmailTemplate,
}: {
  readonly template: Template;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onPreview: () => void;
  readonly DefaultIcon: React.ComponentType<{ className?: string }>;
  readonly isEmailTemplate: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "relative border-2 rounded-lg bg-background overflow-hidden transition-all duration-200 cursor-pointer group text-left w-full",
        "hover:border-primary/50 hover:shadow-sm",
        selected
          ? "border-primary hover:border-primary"
          : "border-border",
      )}
    >
      {/* Keep email cards cleaner by avoiding rendered HTML thumbnails. */}
      {isEmailTemplate ? (
        <div className="p-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <DefaultIcon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Email template</span>
          </div>
        </div>
      ) : (
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
              <DefaultIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Preview button - appears on hover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-background/90 border border-border/60 text-xs text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:text-foreground"
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
        </div>
      )}

        {/* Selected badge */}
        {selected && (
          <div className="absolute top-2 left-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
          </div>
        )}

      {/* Info */}
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
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// List row
// ---------------------------------------------------------------------------
function TemplateListRow({
  template,
  selected,
  onSelect,
  onPreview,
  DefaultIcon,
}: {
  readonly template: Template;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onPreview: () => void;
  readonly DefaultIcon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer transition-colors w-full text-left",
        "hover:bg-muted/40",
        selected
          ? "border-primary/50 bg-primary/5"
          : "border-transparent hover:border-border/50",
      )}
    >
      {/* Icon */}
      <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <DefaultIcon className="h-4 w-4 text-primary" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {template.subject || template.description || "No description"}
        </p>
      </div>

      {/* Category badge */}
      {template.category && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 hidden sm:inline-block">
          {template.category}
        </span>
      )}

      {/* Preview */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 h-8 text-xs shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
      >
        <Eye className="h-3.5 w-3.5" />
        Preview
      </Button>

      {/* Selection indicator */}
      <div
        className={cn(
          "h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
          selected
            ? "border-primary bg-primary"
            : "border-muted-foreground/30",
        )}
      >
        {selected && (
          <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main TemplatePicker
// ---------------------------------------------------------------------------
export default function TemplatePicker({
  templatePath,
  selectedId,
  onSelect,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const isEmail = templatePath === "/templates/emails/";
  const DefaultIcon = isEmail ? Mail : Layout;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await apiClient.get<Template[]>("/templates");
      setTemplates(all.filter((t) => t.path === templatePath));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, [templatePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.subject ?? "").toLowerCase().includes(q),
    );
  }, [templates, searchQuery]);

  const handleImport = () => {
    toast.info("Template import coming soon.");
  };

  return (
    <div className="h-full flex flex-col gap-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 pb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${isEmail ? "email" : "landing page"} templates...`}
            className="w-full pl-10 pr-4 py-2 text-sm border border-border/60 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-muted rounded-md p-1 shrink-0">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "p-2 rounded-md transition-colors cursor-pointer",
              view === "grid"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "p-2 rounded-md transition-colors cursor-pointer",
              view === "list"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Import button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={handleImport}
        >
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4 shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading templates…
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DefaultIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No templates found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Try a different search term or import a custom one
            </p>
          </div>
        )}
        {!isLoading && filtered.length > 0 && view === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
            {filtered.map((t) => (
              <TemplateGridCard
                key={t.id}
                template={t}
                selected={t.id === selectedId}
                onSelect={() => onSelect(t.id, t.name)}
                onPreview={() => setPreviewTemplate(t)}
                DefaultIcon={DefaultIcon}
                isEmailTemplate={isEmail}
              />
            ))}
          </div>
        )}
        {!isLoading && filtered.length > 0 && view === "list" && (
          <div className="flex flex-col gap-1 pb-4">
            {filtered.map((t) => (
              <TemplateListRow
                key={t.id}
                template={t}
                selected={t.id === selectedId}
                onSelect={() => onSelect(t.id, t.name)}
                onPreview={() => setPreviewTemplate(t)}
                DefaultIcon={DefaultIcon}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
