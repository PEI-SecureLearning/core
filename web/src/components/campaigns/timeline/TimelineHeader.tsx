import { memo } from "react";

export interface WeekRange {
    weekNumber: number;
    startDate: Date;
    endDate: Date;
    label: string;
    dateRange: string;
}

interface TimelineHeaderProps {
    weeks: WeekRange[];
    campaignColumnWidth: number;
}

export const TimelineHeader = memo(function TimelineHeader({
    weeks,
    campaignColumnWidth,
}: TimelineHeaderProps) {
    return (
        <div className="flex border-b border-slate-200/60">
            {/* Campaign name column */}
            <div
                className="flex-shrink-0 px-4 py-3"
                style={{ width: campaignColumnWidth }}
            />

            {/* Week columns */}
            <div className="flex-1 flex">
                {weeks.map((week) => (
                    <div
                        key={week.weekNumber}
                        className="flex-1 text-center px-2 py-3 border-l border-slate-200/40"
                    >
                        <div className="text-[13px] font-semibold text-slate-700">
                            Week {week.weekNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                            {week.dateRange}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
