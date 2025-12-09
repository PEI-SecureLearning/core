import { memo } from "react";
import type { CampaignStatus } from "../types";

interface LegendItem {
    status: CampaignStatus | "draft";
    label: string;
    color: string;
}

const legendItems: LegendItem[] = [
    { status: "active", label: "Active", color: "bg-blue-500" },
    { status: "scheduled", label: "Scheduled", color: "bg-amber-400" },
    { status: "completed", label: "Completed", color: "bg-emerald-500" },
    { status: "paused", label: "Draft", color: "bg-slate-400" },
];

export const TimelineLegend = memo(function TimelineLegend() {
    return (
        <div className="flex items-center gap-6">
            {legendItems.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm ${item.color}`} />
                    <span className="text-[12px] text-slate-500 font-medium">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
});
