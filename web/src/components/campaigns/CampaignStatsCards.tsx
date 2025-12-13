import type { Campaign } from "./types";

interface CampaignStatsCardsProps {
    campaigns: Campaign[];
}

export function CampaignStatsCards({ campaigns }: CampaignStatsCardsProps) {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const totalEmailsSent = campaigns.reduce((acc, c) => acc + c.stats.sent, 0);

    const campaignsWithSent = campaigns.filter(c => c.stats.sent > 0);
    const avgClickRate = campaignsWithSent.length > 0
        ? Math.round(
            campaignsWithSent.reduce((acc, c) => acc + (c.stats.clicked / c.stats.sent) * 100, 0) / campaignsWithSent.length
        )
        : 0;

    return (
        <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-500">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{totalCampaigns}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCampaigns}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-500">Total Emails Sent</p>
                <p className="text-2xl font-bold text-purple-600">{totalEmailsSent}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-500">Avg Click Rate</p>
                <p className="text-2xl font-bold text-amber-600">{avgClickRate}%</p>
            </div>
        </div>
    );
}
