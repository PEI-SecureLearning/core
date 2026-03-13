import { useEffect, useMemo, useState } from "react";
import { Check, Layout, AlertCircle, Loader2 } from "lucide-react";
import { useCampaign, type TemplateSelection } from "./CampaignContext";
import { useKeycloak } from "@react-keycloak/web";

interface LandingPageTemplate {
  id: string;
  name: string;
  description?: string;
  path: string;
}

const inputStyle = {
  background: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
};

export default function LandingPageTemplatePicker() {
  const { data, updateData } = useCampaign();
  const { keycloak } = useKeycloak();
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = useMemo(
    () => import.meta.env.VITE_API_URL,
    []
  );

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/templates`, {
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to load templates (${res.status})`);
        }
        const json = (await res.json()) as LandingPageTemplate[];
        setTemplates(json.filter((t) => t.path === "/templates/pages/"));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load templates";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [API_BASE, keycloak.token]);

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = (template: LandingPageTemplate) => {
    const selection: TemplateSelection = {
      id: template.id,
      name: template.name,
      path: template.path,
    };
    updateData({
      landing_page_template: selection,
      landing_page_template_id: null,
    });
  };

  const isTemplateSelected = (templateId: string) => {
    if (data.landing_page_template?.id === templateId) return true;
    if (
      data.landing_page_template_id !== null &&
      Number.isFinite(data.landing_page_template_id)
    ) {
      return String(data.landing_page_template_id) === templateId;
    }
    return false;
  };

  return (
    <div className="h-full w-full flex flex-col gap-4  p-2">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
          <AlertCircle size={16} />
          <p className="text-[13px]">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-muted-foreground tracking-wide uppercase">
          Search Landing Page Templates
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl px-4 py-3 text-[14px] text-foreground/90 placeholder:text-muted-foreground/70 outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-purple-400 w-full max-w-md"
          style={inputStyle}
          placeholder="Search templates..."
        />
      </div>

      {/* Templates Grid */}
      <div className="flex-1 ">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="animate-spin" size={16} />
            Loading templates...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const selected = isTemplateSelected(template.id);
              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${selected
                      ? "ring-2 ring-primary/30 bg-primary/10/50"
                      : "hover:bg-surface-subtle/50"
                    }`}
                  style={{
                    background: selected
                      ? "rgba(147, 51, 234, 0.08)"
                      : "rgba(255, 255, 255, 0.7)",
                    border: selected
                      ? "1px solid rgba(147, 51, 234, 0.3)"
                      : "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                >
                  {selected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary/90 flex items-center justify-center">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                  )}

                  {/* Template Preview Placeholder */}
                  <div
                    className="w-full h-24 rounded-lg mb-3 flex items-center justify-center"
                    style={{ background: "rgba(148, 163, 184, 0.1)" }}
                  >
                    <Layout size={32} className="text-muted-foreground/70" />
                  </div>

                  <h3 className="text-[14px] font-medium text-foreground/90 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-[12px] text-muted-foreground line-clamp-2">
                    {template.description || "No description provided."}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {filteredTemplates.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layout size={40} className="text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-[14px]">No templates found</p>
            <p className="text-muted-foreground/70 text-[13px]">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {(data.landing_page_template || data.landing_page_template_id) && (
        <div className="text-[13px] text-primary font-medium">
          ✓ Selected:{" "}
          {data.landing_page_template?.name ||
            templates.find(
              (t) => String(t.id) === String(data.landing_page_template_id)
            )?.name}
        </div>
      )}
    </div>
  );
}
