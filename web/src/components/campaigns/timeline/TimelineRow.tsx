import { memo } from "react";
import { TimelineBar } from "./TimelineBar";
import type { TimelineCampaign } from "./TimelineView";
import type { WeekRange } from "./TimelineHeader";

interface TimelineRowProps {
    campaign: TimelineCampaign;
    weeks: WeekRange[];
    monthStart: Date;
    monthEnd: Date;
    campaignColumnWidth: number;
}

function formatDateRange(start: Date, end: Date): string {
    const formatDate = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${formatDate(start)} - ${formatDate(end)}`;
}

export const TimelineRow = memo(function TimelineRow({
    campaign,
    weeks,
    monthStart,
    monthEnd,
    campaignColumnWidth,
}: TimelineRowProps) {
    const campaignStart = new Date(campaign.begin_date);
    const campaignEnd = new Date(campaign.end_date);

    // Check if campaign overlaps with current month
    const overlapsMonth = campaignStart <= monthEnd && campaignEnd >= monthStart;
    if (!overlapsMonth) return null;

    // Calculate position and width as percentage of the month
    const monthDuration = monthEnd.getTime() - monthStart.getTime();
    const clampedStart = new Date(Math.max(campaignStart.getTime(), monthStart.getTime()));
    const clampedEnd = new Date(Math.min(campaignEnd.getTime(), monthEnd.getTime()));

    const startPercent =
        ((clampedStart.getTime() - monthStart.getTime()) / monthDuration) * 100;
    const widthPercent =
        ((clampedEnd.getTime() - clampedStart.getTime()) / monthDuration) * 100;

    const dateLabel = formatDateRange(clampedStart, clampedEnd);

    return (
        <div className="flex border-b border-slate-100/60 hover:bg-slate-50/40 transition-colors">
            {/* Campaign info column */}
            <div
                className="flex-shrink-0 px-4 py-4"
                style={{ width: campaignColumnWidth }}
            >
                <div className="text-[13px] font-medium text-slate-800 truncate">
                    {campaign.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                    {campaign.stats.sent} recipients
                </div>
            </div>

            {/* Timeline area */}
            <div className="flex-1 relative h-16">
                {/* Week grid lines */}
                <div className="absolute inset-0 flex">
                    {weeks.map((week) => (
                        <div
                            key={week.weekNumber}
                            className="flex-1 border-l border-slate-200/40"
                        />
                    ))}
                </div>

                {/* Campaign bar */}
                <TimelineBar
                    startPercent={startPercent}
                    widthPercent={widthPercent}
                    status={campaign.status}
                    dateLabel={dateLabel}
                />
            </div>
        </div>
    );
});
