import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

interface CampaignHeaderProps {
    title?: string;
    subtitle?: string;
}

export function CampaignHeader({
    title = "Campaigns",
    subtitle = "Manage your phishing simulation campaigns"
}: CampaignHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-500 mt-1">{subtitle}</p>
            </div>
            <Link
                to="/campaigns/new-campaign"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
                <Plus size={20} />
                New Campaign
            </Link>
        </div>
    );
}
