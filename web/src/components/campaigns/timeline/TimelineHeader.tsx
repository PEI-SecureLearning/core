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
    <div className="flex border-b border-slate-200/60 bg-white/40 backdrop-blur-md z-20 sticky top-0">
      {/* Campaign name column */}
      <div
        className="flex-shrink-0 px-4 py-3 border-r border-slate-200/40 bg-white/20"
        style={{ width: campaignColumnWidth }}
      >
        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
          Campaigns
        </span>
      </div>

      {/* Week/Month columns */}
      <div className="flex-1 flex">
        {weeks.map((week) => (
          <div
            key={week.weekNumber}
            className="flex-1 text-center px-2 py-3 border-r border-slate-200/40 last:border-r-0"
          >
            <div className="text-[13px] font-semibold text-slate-700">
              {/* Mudança Crucial: Usar o label dinâmico em vez de "Week X" fixo */}
              {week.label}
            </div>
            {week.dateRange && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                {week.dateRange}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
