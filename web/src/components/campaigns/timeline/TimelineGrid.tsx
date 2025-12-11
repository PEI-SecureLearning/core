import { memo } from "react";
import { TimelineHeader, type WeekRange } from "./TimelineHeader";
import { TimelineRow } from "./TimelineRow";
import type { TimelineCampaign } from "./TimelineView";

interface TimelineGridProps {
  campaigns: TimelineCampaign[];
  weeks: WeekRange[];
  monthStart: Date;
  monthEnd: Date;
}

const CAMPAIGN_COLUMN_WIDTH = 180;

export const TimelineGrid = memo(function TimelineGrid({
  campaigns,
  weeks,
  monthStart,
  monthEnd,
}: TimelineGridProps) {
  // Filtrar campanhas visíveis no mês atual
  const visibleCampaigns = campaigns.filter((campaign) => {
    const start = new Date(campaign.begin_date);
    const end = new Date(campaign.end_date);
    return start <= monthEnd && end >= monthStart;
  });

  return (
    <div className="h-full flex flex-col bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 overflow-hidden">
      <TimelineHeader
        weeks={weeks}
        campaignColumnWidth={CAMPAIGN_COLUMN_WIDTH}
      />

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 purple-scrollbar">
        {visibleCampaigns.length > 0 ? (
          visibleCampaigns.map((campaign) => (
            <TimelineRow
              key={campaign.id}
              campaign={campaign}
              weeks={weeks}
              monthStart={monthStart}
              monthEnd={monthEnd}
              campaignColumnWidth={CAMPAIGN_COLUMN_WIDTH}
            />
          ))
        ) : (
          <div className="text-center py-12 flex flex-col items-center justify-center h-full">
            <p className="text-slate-400 text-[14px]">
              No campaigns scheduled for this period
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
