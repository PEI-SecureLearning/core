import { memo } from "react";
import { Settings2 } from "lucide-react";
import type { CampaignStatus } from "../types";

interface TimelineBarProps {
    startPercent: number;
    widthPercent: number;
    status: CampaignStatus;
    dateLabel: string;
}

const statusColors: Record<CampaignStatus, { bg: string; border: string }> = {
    active: {
        bg: "bg-gradient-to-r from-blue-400 to-blue-500",
        border: "border-blue-400/30",
    },
    scheduled: {
        bg: "bg-gradient-to-r from-amber-300 to-amber-400",
        border: "border-amber-400/30",
    },
    completed: {
        bg: "bg-gradient-to-r from-emerald-400 to-emerald-500",
        border: "border-emerald-400/30",
    },
    paused: {
        bg: "bg-gradient-to-r from-slate-300 to-slate-400",
        border: "border-slate-400/30",
    },
    failed: {
        bg: "bg-gradient-to-r from-rose-400 to-rose-500",
        border: "border-rose-400/30",
    },
};

export const TimelineBar = memo(function TimelineBar({
    startPercent,
    widthPercent,
    status,
    dateLabel,
}: TimelineBarProps) {
    const colors = statusColors[status];

    return (
        <div
            className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg ${colors.bg} ${colors.border} border shadow-sm flex items-center justify-between px-2.5 cursor-pointer hover:shadow-md transition-shadow duration-200 group`}
            style={{
                left: `${startPercent}%`,
                width: `${Math.max(widthPercent, 8)}%`,
                minWidth: "80px",
            }}
        >
            <span className="text-[11px] font-medium text-white truncate drop-shadow-sm">
                {dateLabel}
            </span>
            <Settings2
                size={14}
                className="text-white/70 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
            />
        </div>
    );
});
