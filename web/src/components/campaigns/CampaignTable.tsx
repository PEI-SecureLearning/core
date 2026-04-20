import {
  Calendar,
  Mail,
  Globe,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import type { Campaign, CampaignStatus } from "./types";

interface CampaignTableProps {
  readonly campaigns: Campaign[];
}

const statusConfig: Record<
  CampaignStatus,
  {
    readonly label: string;
    readonly color: string;
    readonly bg: string;
    readonly icon: React.ElementType;
  }
> = {
  active: {
    label: "Active",
    color: "text-success",
    bg: "bg-success/10",
    icon: Play
  },
  completed: {
    label: "Completed",
    color: "text-primary",
    bg: "bg-primary/10",
    icon: CheckCircle
  },
  scheduled: {
    label: "Scheduled",
    color: "text-warning",
    bg: "bg-warning/10",
    icon: Clock
  },
  paused: {
    label: "Paused",
    color: "text-foreground/90",
    bg: "bg-muted",
    icon: Pause
  },
  failed: {
    label: "Failed",
    color: "text-error",
    bg: "bg-error/10",
    icon: XCircle
  }
};

function CampaignStatusBadge({ status }: { readonly status: CampaignStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
}

function CampaignTableRow({ campaign }: { readonly campaign: Campaign }) {
  const clickRate =
    campaign.stats.sent > 0
      ? ((campaign.stats.clicked / campaign.stats.sent) * 100).toFixed(1)
      : "0";
  const openRate =
    campaign.stats.sent > 0
      ? ((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(1)
      : "0";

  return (
    <tr className="hover:bg-surface-subtle transition-colors">
      <td className="px-6 py-4">
        <a href={`/campaigns/${campaign.id}`} className="block">
          <p className="font-medium text-foreground hover:text-primary">
            {campaign.name}
          </p>
          <p className="text-sm text-muted-foreground truncate max-w-xs">
            {campaign.description}
          </p>
        </a>
      </td>
      <td className="px-6 py-4">
        <CampaignStatusBadge status={campaign.status} />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar size={14} />
          <span>
            {new Date(campaign.begin_date).toLocaleDateString()} -{" "}
            {new Date(campaign.end_date).toLocaleDateString()}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5">
          <Mail size={14} className="text-muted-foreground/70" />
          <span className="font-medium text-foreground">
            {campaign.stats.sent}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {campaign.stats.opened}
          </span>
          <span className="text-xs text-muted-foreground">({openRate}%)</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-warning" />
          <span className="font-medium text-foreground">
            {campaign.stats.clicked}
          </span>
          <span className="text-xs text-muted-foreground">({clickRate}%)</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <MoreVertical size={16} className="text-muted-foreground/70" />
        </button>
      </td>
    </tr>
  );
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  return (
    <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-surface-subtle border-b border-border">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Campaign
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Duration
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sent
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Opened
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Clicked
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {campaigns.map((campaign) => (
            <CampaignTableRow key={campaign.id} campaign={campaign} />
          ))}
        </tbody>
      </table>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No campaigns found</p>
        </div>
      )}
    </div>
  );
}
