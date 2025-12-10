import { Calendar, Mail, Globe, MoreVertical, Play, Pause, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Campaign, CampaignStatus } from "./types";

interface CampaignTableProps {
    campaigns: Campaign[];
}

const statusConfig: Record<CampaignStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    active: { label: "Active", color: "text-green-700", bg: "bg-green-100", icon: Play },
    completed: { label: "Completed", color: "text-blue-700", bg: "bg-blue-100", icon: CheckCircle },
    scheduled: { label: "Scheduled", color: "text-amber-700", bg: "bg-amber-100", icon: Clock },
    paused: { label: "Paused", color: "text-gray-700", bg: "bg-gray-100", icon: Pause },
    failed: { label: "Failed", color: "text-red-700", bg: "bg-red-100", icon: XCircle },
};

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
}

function CampaignTableRow({ campaign }: { campaign: Campaign }) {
    const clickRate = campaign.stats.sent > 0
        ? ((campaign.stats.clicked / campaign.stats.sent) * 100).toFixed(1)
        : "0";
    const openRate = campaign.stats.sent > 0
        ? ((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(1)
        : "0";

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4">
                <a href={`/campaigns/${campaign.id}`} className="block">
                    <p className="font-medium text-gray-900 hover:text-purple-600">{campaign.name}</p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{campaign.description}</p>
                </a>
            </td>
            <td className="px-6 py-4">
                <CampaignStatusBadge status={campaign.status} />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>
                        {new Date(campaign.begin_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5">
                    <Mail size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{campaign.stats.sent}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{campaign.stats.opened}</span>
                    <span className="text-xs text-gray-500">({openRate}%)</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <Globe size={14} className="text-amber-500" />
                    <span className="font-medium text-gray-900">{campaign.stats.clicked}</span>
                    <span className="text-xs text-gray-500">({clickRate}%)</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical size={16} className="text-gray-400" />
                </button>
            </td>
        </tr>
    );
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Opened</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clicked</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {campaigns.map((campaign) => (
                        <CampaignTableRow key={campaign.id} campaign={campaign} />
                    ))}
                </tbody>
            </table>

            {campaigns.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No campaigns found</p>
                </div>
            )}
        </div>
    );
}
