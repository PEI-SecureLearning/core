import type { Campaign } from "./types";

interface CampaignStatsCardsProps {
    readonly campaigns: Campaign[];
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
            <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold text-foreground">{totalCampaigns}</p>
            </div>
            <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success">{activeCampaigns}</p>
            </div>
            <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                <p className="text-sm text-muted-foreground">Total Emails Sent</p>
                <p className="text-2xl font-bold text-primary">{totalEmailsSent}</p>
            </div>
            <div className="bg-background p-4 rounded-xl border border-border shadow-sm">
                <p className="text-sm text-muted-foreground">Avg Click Rate</p>
                <p className="text-2xl font-bold text-warning">{avgClickRate}%</p>
            </div>
        </div>
    );
}
