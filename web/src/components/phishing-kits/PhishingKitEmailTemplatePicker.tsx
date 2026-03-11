import { useEffect, useMemo, useState } from "react";
import { Check, Mail, AlertCircle, Loader2 } from "lucide-react";
import { usePhishingKit } from "./PhishingKitContext";
import { useKeycloak } from "@react-keycloak/web";

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  path: string;
}

const inputStyle = {
  background: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
};

export default function PhishingKitEmailTemplatePicker() {
  const { data, updateData } = usePhishingKit();
  const { keycloak } = useKeycloak();
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = useMemo(() => import.meta.env.VITE_API_URL, []);

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
        const json = (await res.json()) as EmailTemplate[];
        setTemplates(json.filter((t) => t.path === "/templates/emails/"));
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

  const handleSelectTemplate = (template: EmailTemplate) => {
    updateData({
      email_template_id: Number(template.id),
      email_template_name: template.name,
    });
  };

  const isTemplateSelected = (templateId: string) => {
    return data.email_template_id === Number(templateId);
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 p-2">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
          <AlertCircle size={16} />
          <p className="text-[13px]">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email-template-search"
          className="text-[12px] font-normal text-slate-500 tracking-wide uppercase"
        >
          Search Email Templates
        </label>
        <input
          id="email-template-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-full max-w-md"
          style={inputStyle}
          placeholder="Search by name or description..."
        />
      </div>

      {/* Templates Grid */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin" size={16} />
            Loading email templates...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const selected = isTemplateSelected(template.id);
              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    selected
                      ? "ring-2 ring-purple-500 bg-purple-50/50"
                      : "hover:bg-slate-50/50"
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
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                  )}

                  <div
                    className="w-full h-24 rounded-lg mb-3 flex items-center justify-center"
                    style={{ background: "rgba(148, 163, 184, 0.1)" }}
                  >
                    <Mail size={32} className="text-slate-400" />
                  </div>

                  <h3 className="text-[14px] font-medium text-slate-700 mb-1">
                    {template.name}
                  </h3>
                  {template.subject && (
                    <p className="text-[11px] text-purple-500 mb-1 truncate">
                      Subject: {template.subject}
                    </p>
                  )}
                  <p className="text-[12px] text-slate-500 line-clamp-2">
                    {template.description || "No description provided."}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {filteredTemplates.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail size={40} className="text-slate-300 mb-3" />
            <p className="text-slate-500 text-[14px]">No email templates found</p>
            <p className="text-slate-400 text-[13px]">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {data.email_template_name && (
        <div className="text-[13px] text-purple-600 font-medium">
          ✓ Selected: {data.email_template_name}
        </div>
      )}
    </div>
  );
}
