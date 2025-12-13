import { useEffect, useMemo, useState } from "react";
import { Check, Mail, AlertCircle, Send, Loader2 } from "lucide-react";
import { useCampaign, type TemplateSelection } from "./CampaignContext";
import { useKeycloak } from "@react-keycloak/web";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  path: string;
  description?: string;
}

interface SendingProfile {
  id: number;
  name: string;
  from_email: string;
  smtp_host: string;
}

const inputStyle = {
  background: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
};

export default function EmailTemplatePicker() {
  const { data, updateData } = useCampaign();
  const { keycloak } = useKeycloak();
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sending profiles from API
  const [sendingProfiles, setSendingProfiles] = useState<SendingProfile[]>([]);
  const [sendingProfilesLoading, setSendingProfilesLoading] = useState(false);
  const [sendingProfilesError, setSendingProfilesError] = useState<
    string | null
  >(null);

  const API_BASE = useMemo(
    () => import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
    []
  );

  useEffect(() => {
    const fetchSendingProfiles = async () => {
      setSendingProfilesLoading(true);
      setSendingProfilesError(null);
      try {
        const res = await fetch(`${API_BASE}/sending-profiles`, {
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to load sending profiles (${res.status})`);
        }
        const json = (await res.json()) as SendingProfile[];
        setSendingProfiles(json);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load sending profiles";
        setSendingProfilesError(message);
      } finally {
        setSendingProfilesLoading(false);
      }
    };
    fetchSendingProfiles();
  }, [API_BASE, keycloak.token]);

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
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = (template: EmailTemplate) => {
    const selection: TemplateSelection = {
      id: template.id,
      name: template.name,
      subject: template.subject,
      path: template.path,
    };
    updateData({
      email_template: selection,
      email_template_id: null,
    });
  };

  const handleSelectSendingProfile = (profileId: number) => {
    updateData({ sending_profile_id: profileId });
  };

  const isTemplateSelected = (templateId: string) => {
    if (data.email_template?.id === templateId) return true;
    if (
      data.email_template_id !== null &&
      Number.isFinite(data.email_template_id)
    ) {
      return String(data.email_template_id) === templateId;
    }
    return false;
  };

  return (
    <div className="h-full w-full flex flex-col gap-4  p-2 overflow-y-scroll">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
          <AlertCircle size={16} />
          <p className="text-[13px]">{error}</p>
        </div>
      )}

      {/* Sending Profile Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase flex items-center gap-1.5">
          <Send size={12} />
          Sending Profile <span className="text-rose-400">*</span>
        </label>
        {sendingProfilesLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin" size={16} />
            Loading sending profiles...
          </div>
        ) : sendingProfilesError ? (
          <div className="flex items-center gap-2 p-2 rounded bg-rose-50 border border-rose-200 text-rose-700">
            <AlertCircle size={14} />
            <span>{sendingProfilesError}</span>
          </div>
        ) : (
          <>
            <select
              value={data.sending_profile_id ?? ""}
              onChange={(e) =>
                handleSelectSendingProfile(Number(e.target.value))
              }
              className="rounded-xl px-4 py-3 text-[14px] text-slate-700 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-full max-w-md cursor-pointer"
              style={inputStyle}
            >
              <option value="" disabled>
                Select a sending profile...
              </option>
              {sendingProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.from_email})
                </option>
              ))}
            </select>
            {data.sending_profile_id && (
              <p className="text-[12px] text-slate-500">
                SMTP:{" "}
                {
                  sendingProfiles.find((p) => p.id === data.sending_profile_id)
                    ?.smtp_host
                }
              </p>
            )}
          </>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase">
          Search Email Templates
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-full max-w-md"
          style={inputStyle}
          placeholder="Search templates..."
        />
      </div>

      {/* Templates Grid */}
      <div className="flex-1 ">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
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
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={16} className="text-purple-500" />
                    <h3 className="text-[14px] font-medium text-slate-700">
                      {template.name}
                    </h3>
                  </div>
                  <p className="text-[13px] font-medium text-slate-600 mb-1">
                    {template.subject}
                  </p>
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
            <p className="text-slate-500 text-[14px]">No templates found</p>
            <p className="text-slate-400 text-[13px]">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {(data.email_template || data.email_template_id) && (
        <div className="text-[13px] text-purple-600 font-medium">
          ✓ Selected:{" "}
          {data.email_template?.name ||
            templates.find(
              (t) => String(t.id) === String(data.email_template_id)
            )?.name}
        </div>
      )}
    </div>
  );
}
