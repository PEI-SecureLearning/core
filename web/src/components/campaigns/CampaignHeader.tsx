import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

interface CampaignHeaderProps {
    readonly title?: string;
    readonly subtitle?: string;
}

export function CampaignHeader({
    title = "Campaigns",
    subtitle = "Manage your phishing simulation campaigns"
}: CampaignHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                <p className="text-muted-foreground mt-1">{subtitle}</p>
            </div>
            <Link
                to="/campaigns/new"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors font-medium"
            >
                <Plus size={20} />
                New Campaign
            </Link>
        </div>
    );
}
