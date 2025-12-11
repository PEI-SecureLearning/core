import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  Calendar,
  Mail,
  Globe,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  CalendarRange,
} from "lucide-react";

// Types
interface Campaign {
  id: string;
  name: string;
  description: string;
  begin_date: string;
  end_date: string;
  status: "active" | "completed" | "scheduled" | "paused" | "failed";
  stats: { sent: number; opened: number; clicked: number };
}

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Q4 Security Awareness",
    description: "End of year security training campaign",
    begin_date: "2024-10-01",
    end_date: "2024-12-31",
    status: "active",
    stats: { sent: 450, opened: 280, clicked: 45 },
  },
  {
    id: "2",
    name: "Phishing Simulation - IT Department",
    description: "Targeted phishing test for IT staff",
    begin_date: "2024-11-15",
    end_date: "2024-11-30",
    status: "completed",
    stats: { sent: 85, opened: 72, clicked: 12 },
  },
  {
    id: "3",
    name: "New Employee Onboarding",
    description: "Security awareness for new hires",
    begin_date: "2024-12-01",
    end_date: "2025-01-15",
    status: "scheduled",
    stats: { sent: 0, opened: 0, clicked: 0 },
  },
  {
    id: "4",
    name: "Executive Team Test",
    description: "High-priority phishing simulation",
    begin_date: "2024-09-01",
    end_date: "2024-09-15",
    status: "paused",
    stats: { sent: 15, opened: 14, clicked: 3 },
  },
  {
    id: "5",
    name: "Finance Department Audit",
    description: "Quarterly security audit",
    begin_date: "2024-08-01",
    end_date: "2024-08-31",
    status: "failed",
    stats: { sent: 120, opened: 95, clicked: 28 },
  },
];

const statusConfig = {
  active: {
    label: "Active",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20",
    Icon: Play,
  },
  completed: {
    label: "Completed",
    color: "text-blue-600",
    bg: "bg-blue-500/10 backdrop-blur-sm border border-blue-500/20",
    Icon: CheckCircle,
  },
  scheduled: {
    label: "Scheduled",
    color: "text-amber-600",
    bg: "bg-amber-500/10 backdrop-blur-sm border border-amber-500/20",
    Icon: Clock,
  },
  paused: {
    label: "Paused",
    color: "text-slate-600",
    bg: "bg-slate-500/10 backdrop-blur-sm border border-slate-500/20",
    Icon: Pause,
  },
  failed: {
    label: "Failed",
    color: "text-rose-600",
    bg: "bg-rose-500/10 backdrop-blur-sm border border-rose-500/20",
    Icon: XCircle,
  },
};

// Glass Dropdown Component
interface GlassDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function GlassDropdown({ value, onChange, options }: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "Select";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 shadow-lg shadow-slate-200/30 cursor-pointer transition-all duration-200 hover:shadow-xl"
        style={{
          background: "rgba(255, 255, 255, 0.27)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(77, 76, 76, 0.06)",
        }}
      >
        <span className="text-[14px] font-medium text-slate-600">
          {selectedLabel}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 min-w-[160px] rounded-xl shadow-xl shadow-slate-300/40 z-50 overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.27)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(77, 76, 76, 0.06)",
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-[14px] font-medium transition-all duration-150 ${
                value === option.value
                  ? "text-purple-600 bg-purple-500/10"
                  : "text-slate-600 hover:bg-white/40"
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

export const Route = createFileRoute("/campaigns/")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCampaigns = mockCampaigns.length;
  const activeCampaigns = mockCampaigns.filter(
    (c) => c.status === "active"
  ).length;
  const totalEmailsSent = mockCampaigns.reduce(
    (acc, c) => acc + c.stats.sent,
    0
  );

  return (
    <div className="p-8 space-y-8 font-[Inter,system-ui,sans-serif] min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 min-w-[320px] sm:min-w-[640px] md:min-w-[768px] lg:min-w-[1024px] xl:min-w-[1280px] animate-[fadeIn_0.5s_ease-out]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Header */}
      <div className="h-[5%] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Campaigns
          </h1>
          <p className="text-slate-500 mt-1.5 text-[15px] font-normal">
            Manage your phishing simulation campaigns
          </p>
        </div>
        <Link
          to="/campaigns/new"
          className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium text-[14px] shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          New Campaign
        </Link>
      </div>

      {/* Filters */}
      <div className="h-[5%] flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all duration-200 text-[14px] font-normal text-slate-700 placeholder:text-slate-400 shadow-sm"
          />
        </div>
        <GlassDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "scheduled", label: "Scheduled" },
            { value: "paused", label: "Paused" },
            { value: "completed", label: "Completed" },
            { value: "failed", label: "Failed" },
          ]}
        />
        {/* Timeline Button */}
        <Link
          to="/campaigns/timeline"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 cursor-pointer shadow-lg shadow-slate-200/30 hover:shadow-xl text-slate-600 hover:text-purple-600"
          style={{
            background: "rgba(255, 255, 255, 0.27)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(77, 76, 76, 0.06)",
          }}
        >
          <CalendarRange size={16} />
          Timeline
        </Link>
      </div>

      {/* Stats Cards - Glass Effect */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 h-auto md:h-[10%] min-w-0">
        <div className="h-full bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-0.5">
          <p className="text-[13px] font-medium text-slate-500 tracking-wide uppercase">
            Total Campaigns
          </p>
          <p className="text-3xl font-semibold text-slate-900 mt-1.5 tracking-tight">
            {totalCampaigns}
          </p>
        </div>
        <div className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-emerald-200/40 transition-all duration-300 hover:-translate-y-0.5">
          <p className="text-[13px] font-medium text-slate-500 tracking-wide uppercase">
            Active
          </p>
          <p className="text-3xl font-semibold text-emerald-600 mt-1.5 tracking-tight">
            {activeCampaigns}
          </p>
        </div>
        <div className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-purple-200/40 transition-all duration-300 hover:-translate-y-0.5">
          <p className="text-[13px] font-medium text-slate-500 tracking-wide uppercase">
            Total Emails Sent
          </p>
          <p className="text-3xl font-semibold text-purple-600 mt-1.5 tracking-tight">
            {totalEmailsSent.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-amber-200/40 transition-all duration-300 hover:-translate-y-0.5">
          <p className="text-[13px] font-medium text-slate-500 tracking-wide uppercase">
            Avg Click Rate
          </p>
          <p className="text-3xl font-semibold text-amber-600 mt-1.5 tracking-tight">
            13%
          </p>
        </div>
      </div>

      {/* Campaigns Table - Glass Effect */}
      <div className="h-[55%] mt-13 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200/60 flex-shrink-0">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-[22%]">
                  Campaign
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-[12%]">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-[20%]">
                  Duration
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-[12%]">
                  Sent
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-[12%]">
                  Opened
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-[12%]">
                  Clicked
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-[10%]"></th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <tbody className="divide-y divide-slate-100/60">
              {filteredCampaigns.map((campaign) => {
                const status = statusConfig[campaign.status];
                const StatusIcon = status.Icon;
                const clickRate =
                  campaign.stats.sent > 0
                    ? (
                        (campaign.stats.clicked / campaign.stats.sent) *
                        100
                      ).toFixed(1)
                    : "0";
                const openRate =
                  campaign.stats.sent > 0
                    ? (
                        (campaign.stats.opened / campaign.stats.sent) *
                        100
                      ).toFixed(1)
                    : "0";

                return (
                  <tr
                    key={campaign.id}
                    className="hover:bg-slate-50/60 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 w-[22%]">
                      <p className="font-medium text-[14px] text-slate-900 tracking-tight">
                        {campaign.name}
                      </p>
                      <p className="text-[13px] text-slate-500 truncate max-w-xs mt-0.5">
                        {campaign.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 w-[12%]">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium ${status.color} ${status.bg}`}
                      >
                        <StatusIcon size={13} strokeWidth={2.5} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-[20%]">
                      <div className="flex items-center gap-2 text-[13px] text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="font-normal">
                          {new Date(campaign.begin_date).toLocaleDateString()} -{" "}
                          {new Date(campaign.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-[12%]">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        <span className="font-semibold text-[14px] text-slate-900">
                          {campaign.stats.sent.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-[12%]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[14px] text-slate-900">
                          {campaign.stats.opened.toLocaleString()}
                        </span>
                        <span className="text-[12px] text-slate-400 font-normal">
                          ({openRate}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-[12%]">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-amber-500" />
                        <span className="font-semibold text-[14px] text-slate-900">
                          {campaign.stats.clicked}
                        </span>
                        <span className="text-[12px] text-slate-400 font-normal">
                          ({clickRate}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-[10%]">
                      <button className="p-2 hover:bg-slate-100/80 rounded-lg transition-colors duration-150 group">
                        <MoreVertical
                          size={16}
                          className="text-slate-400 group-hover:text-slate-600"
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-[15px] font-normal">
              No campaigns found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
