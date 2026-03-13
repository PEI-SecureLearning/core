import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import {
  Plus,
  Search,
  ChevronDown,
  Calendar,
  Mail,
  Globe,
  MoreVertical,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  CalendarRange,
} from "lucide-react";

type ApiCampaignStatus = "scheduled" | "running" | "completed" | "canceled";

interface ApiCampaign {
  id: number;
  name: string;
  description?: string;
  begin_date: string;
  end_date: string;
  status: ApiCampaignStatus;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  begin_date: string;
  end_date: string;
  status: "scheduled" | "running" | "completed" | "canceled";
  stats: { sent: number; opened: number; clicked: number };
}

interface TemplateDoc {
  id: string;
  name: string;
  subject?: string | null;
  description?: string | null;
  html?: string | null;
  path?: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL;

function mapStatus(status: ApiCampaignStatus): Campaign["status"] {
  switch (status) {
    case "running":   return "running";
    case "completed": return "completed";
    case "scheduled": return "scheduled";
    case "canceled":  return "canceled";
    default:          return "scheduled";
  }
}

// ─── Status badge config ────────────────────────────────────────────────────
const statusConfig = {
  running: {
    label: "Running",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border border-emerald-500/20",
    Icon: Play,
  },
  completed: {
    label: "Completed",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border border-blue-500/20",
    Icon: CheckCircle,
  },
  scheduled: {
    label: "Scheduled",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border border-amber-500/20",
    Icon: Clock,
  },
  canceled: {
    label: "Canceled",
    color: "text-muted-foreground",
    bg: "bg-muted/40 border border-border",
    Icon: XCircle,
  },
};

// ─── Dropdown ───────────────────────────────────────────────────────────────
interface GlassDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function Dropdown({ value, onChange, options }: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "Select";

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 cursor-pointer transition-all duration-200
                   bg-surface border border-border text-foreground hover:border-accent-secondary/40 hover:bg-surface-subtle"
      >
        <span className="text-[14px] font-medium">{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 min-w-[160px] rounded-xl shadow-xl z-50 overflow-hidden
                        bg-surface border border-border">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-[14px] font-medium transition-all duration-150 ${
                value === option.value
                  ? "text-accent-secondary bg-accent/10"
                  : "text-foreground hover:bg-surface-subtle"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Route ──────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/campaigns/")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const { keycloak } = useKeycloak();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [emailTemplate] = useState<TemplateDoc | null>(null);
  const [landingTemplate] = useState<TemplateDoc | null>(null);
  const [detailLoading] = useState(false);
  const [detailError] = useState<string | null>(null);

  useEffect(() => {
    const realm = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss?.split("/realms/")[1];
    if (!realm) { setError("Could not resolve realm from token."); return; }

    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/org-manager/${encodeURIComponent(realm)}/campaigns`,
          { headers: { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "" } }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to load campaigns (${res.status})`);
        }
        const data = (await res.json()) as { campaigns: ApiCampaign[] };
        const mapped: Campaign[] = (data.campaigns || []).map((c) => ({
          id: String(c.id),
          name: c.name,
          description: c.description || "",
          begin_date: c.begin_date,
          end_date: c.end_date,
          status: mapStatus(c.status),
          stats: { sent: c.total_sent ?? 0, opened: c.total_opened ?? 0, clicked: c.total_clicked ?? 0 },
        }));
        setCampaigns(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [keycloak.token, keycloak.tokenParsed]);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCampaigns   = campaigns.length;
  const activeCampaigns  = campaigns.filter((c) => c.status === "running").length;
  const totalEmailsSent  = campaigns.reduce((acc, c) => acc + c.stats.sent, 0);
  const totalClicks      = campaigns.reduce((acc, c) => acc + c.stats.clicked, 0);
  const avgClickRate     = totalEmailsSent > 0
    ? ((totalClicks / totalEmailsSent) * 100).toFixed(1)
    : "0.0";

  // ─── Loading / error states ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm animate-pulse">Loading campaigns…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  // ─── Page ─────────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8 min-h-screen bg-background text-foreground">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Campaigns
          </h1>
          <p className="text-muted-foreground mt-1.5 text-[15px]">
            Manage your phishing simulation campaigns
          </p>
        </div>
        <Link
          to="/campaigns/new"
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-[14px]
                     text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                     shadow-lg shadow-[#7C3AED]/25 hover:shadow-[#7C3AED]/40"
          style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}
        >
          <Plus size={18} strokeWidth={2.5} />
          New Campaign
        </Link>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search campaigns…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-[14px] outline-none transition-all duration-200
                       bg-surface border border-border text-foreground placeholder:text-muted-foreground
                       focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]/60"
          />
        </div>
        <Dropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all",       label: "All Status"  },
            { value: "running",   label: "Running"     },
            { value: "scheduled", label: "Scheduled"   },
            { value: "completed", label: "Completed"   },
            { value: "canceled",  label: "Canceled"    },
          ]}
        />
        <Link
          to="/campaigns/timeline"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200
                     bg-surface border border-border text-muted-foreground hover:text-accent-secondary hover:border-accent-secondary/40"
        >
          <CalendarRange size={16} />
          Timeline
        </Link>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">

        {/* Total */}
        <div className="bg-surface border border-border rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-300
                        hover:border-[#A78BFA]/30 hover:shadow-lg hover:shadow-[#7C3AED]/10">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Campaigns
          </p>
          <p className="text-3xl font-semibold text-foreground mt-1.5">{totalCampaigns}</p>
        </div>

        {/* Active */}
        <div className="bg-surface border border-border rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-300
                        hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Active</p>
          <p className="text-3xl font-semibold text-emerald-400 mt-1.5">{activeCampaigns}</p>
        </div>

        {/* Sent */}
        <div className="bg-surface border border-border rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-300
                        hover:border-[#A78BFA]/30 hover:shadow-lg hover:shadow-[#7C3AED]/10">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Total Sent</p>
          <p className="text-3xl font-semibold mt-1.5"
             style={{ background: "linear-gradient(135deg, #A78BFA, #9333EA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {totalEmailsSent.toLocaleString()}
          </p>
        </div>

        {/* Click rate */}
        <div className="bg-surface border border-border rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-300
                        hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Avg Click Rate</p>
          <p className="text-3xl font-semibold text-amber-400 mt-1.5">{avgClickRate}%</p>
        </div>

      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl flex flex-col overflow-hidden">

        {/* Fixed header */}
        <div className="bg-surface-subtle border-b border-border flex-shrink-0">
          <table className="w-full">
            <thead>
              <tr>
                {["Campaign", "Status", "Duration", "Sent", "Opened", "Clicked", ""].map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                    style={{ width: ["22%","12%","20%","12%","12%","12%","10%"][i] }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto max-h-[55vh]">
          <table className="w-full">
            <tbody className="divide-y divide-border">
              {filteredCampaigns.map((campaign) => {
                const status = statusConfig[campaign.status];
                const StatusIcon = status.Icon;
                const clickRate = campaign.stats.sent > 0
                  ? ((campaign.stats.clicked / campaign.stats.sent) * 100).toFixed(1)
                  : "0";
                const openRate = campaign.stats.sent > 0
                  ? ((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(1)
                  : "0";

                return (
                  <tr
                    key={campaign.id}
                    className="hover:bg-surface-subtle transition-colors duration-150"
                  >
                    <td className="px-6 py-4 w-[22%]">
                      <p className="font-medium text-[14px] text-foreground tracking-tight">
                        {campaign.name}
                      </p>
                      <p className="text-[13px] text-muted-foreground truncate max-w-xs mt-0.5">
                        {campaign.description}
                      </p>
                    </td>

                    <td className="px-6 py-4 w-[12%]">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium ${status.color} ${status.bg}`}>
                        <StatusIcon size={13} strokeWidth={2.5} />
                        {status.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 w-[20%]">
                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <Calendar size={14} className="text-muted-foreground/60" />
                        {new Date(campaign.begin_date).toLocaleDateString()} –{" "}
                        {new Date(campaign.end_date).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 w-[12%]">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-muted-foreground/60" />
                        <span className="font-semibold text-[14px] text-foreground">
                          {campaign.stats.sent.toLocaleString()}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 w-[12%]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[14px] text-foreground">
                          {campaign.stats.opened.toLocaleString()}
                        </span>
                        <span className="text-[12px] text-muted-foreground">({openRate}%)</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 w-[12%]">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-amber-400/80" />
                        <span className="font-semibold text-[14px] text-foreground">
                          {campaign.stats.clicked}
                        </span>
                        <span className="text-[12px] text-muted-foreground">({clickRate}%)</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 w-[10%]">
                      <div className="relative inline-block text-left">
                        <details className="group">
                          <summary className="list-none p-2 hover:bg-surface-subtle rounded-lg transition-colors cursor-pointer flex items-center justify-center">
                            <MoreVertical size={16} className="text-muted-foreground group-hover:text-foreground" />
                          </summary>
                          <div className="absolute right-0 mt-2 w-40 rounded-xl bg-surface border border-border shadow-xl z-10 py-1">
                            <Link
                              to={`/campaigns/${campaign.id}` as any}
                              className="w-full text-left px-4 py-2 text-[13px] text-foreground hover:bg-surface-subtle block transition-colors"
                            >
                              View Details
                            </Link>
                            <button
                              className="w-full text-left px-4 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                              onClick={async () => {
                                if (!confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;
                                try {
                                  const realm = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss?.split("/realms/")[1];
                                  if (!realm) { alert("Could not resolve realm from token."); return; }
                                  const res = await fetch(
                                    `${API_BASE}/org-manager/${encodeURIComponent(realm)}/campaigns/${campaign.id}`,
                                    { method: "DELETE", headers: { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "" } }
                                  );
                                  if (!res.ok) throw new Error(await res.text() || `Failed (${res.status})`);
                                  setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
                                } catch (err) {
                                  alert(err instanceof Error ? err.message : "Failed to delete campaign");
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-[15px]">No campaigns found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail modal ───────────────────────────────────────────────── */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full h-full max-w-5xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-xs uppercase text-muted-foreground tracking-wide">Campaign Details</p>
                <h2 className="text-lg font-semibold text-foreground">{selectedCampaign.name}</h2>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSelectedCampaign(null)}>
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm text-foreground">
              <p><span className="font-medium text-muted-foreground">Description:</span> {selectedCampaign.description || "No description"}</p>
              <p><span className="font-medium text-muted-foreground">Start:</span> {new Date(selectedCampaign.begin_date).toLocaleString()}</p>
              <p><span className="font-medium text-muted-foreground">End:</span> {new Date(selectedCampaign.end_date).toLocaleString()}</p>
              <p><span className="font-medium text-muted-foreground">Status:</span> {statusConfig[selectedCampaign.status].label}</p>

              <div className="grid grid-cols-3 gap-3">
                {(["sent","opened","clicked"] as const).map((k) => (
                  <div key={k} className="bg-surface-subtle rounded-xl p-3 border border-border">
                    <p className="text-[11px] uppercase text-muted-foreground">{k}</p>
                    <p className="text-base font-semibold text-foreground mt-0.5">{selectedCampaign.stats[k]}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{ label: "Email Template", data: emailTemplate }, { label: "Landing Page", data: landingTemplate }].map(({ label, data }) => (
                  <div key={label} className="bg-surface-subtle rounded-xl p-4 border border-border">
                    <p className="text-xs uppercase text-muted-foreground mb-2">{label}</p>
                    {detailLoading ? (
                      <p className="text-muted-foreground text-sm">Loading…</p>
                    ) : detailError ? (
                      <p className="text-red-400 text-sm">{detailError}</p>
                    ) : data ? (
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground">{data.name}</p>
                        {data.html && (
                          <div className="border border-border rounded-lg p-2 bg-background max-h-48 overflow-auto">
                            <div dangerouslySetInnerHTML={{ __html: data.html }} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Not available</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border flex justify-end">
              <button
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#7C3AED] hover:bg-[#9333EA] transition-colors"
                onClick={() => setSelectedCampaign(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
