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
    <div className="flex border-b border-border/60 bg-background/40 backdrop-blur-md z-20 sticky top-0">
      {/* Campaign name column */}
      <div
        className="shrink-0 px-4 py-3 border-r border-border/40 bg-background/20"
        style={{ width: campaignColumnWidth }}
      >
        <span className="text-[12px] font-bold text-muted-foreground/70 uppercase tracking-wider">
          Campaigns
        </span>
      </div>

      {/* Week/Month columns */}
      <div className="flex-1 flex">
        {weeks.map((week) => (
          <div
            key={week.weekNumber}
            className="flex-1 text-center px-2 py-3 border-r border-border/40 last:border-r-0"
          >
            <div className="text-[13px] font-semibold text-foreground/90">
              {/* Mudança Crucial: Usar o label dinâmico em vez de "Week X" fixo */}
              {week.label}
            </div>
            {week.dateRange && (
              <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                {week.dateRange}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
