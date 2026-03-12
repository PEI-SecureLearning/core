import { memo } from "react";
import type { CampaignStatus } from "@/services/campaignsApi"; // Importa do serviço

interface LegendItem {
  status: CampaignStatus;
  label: string;
  color: string;
}

const legendItems: LegendItem[] = [
  { status: "running", label: "Running", color: "bg-blue-500" }, // Era "active"
  { status: "scheduled", label: "Scheduled", color: "bg-amber-400" },
  { status: "completed", label: "Completed", color: "bg-emerald-500" },
  { status: "canceled", label: "Canceled", color: "bg-muted-foreground/40" }, // Era "paused"
];

export const TimelineLegend = memo(function TimelineLegend() {
  return (
    <div className="flex items-center gap-4 bg-background/40 px-3 py-1.5 rounded-xl border border-white/40 shadow-sm">
      {legendItems.map((item) => (
        <div key={item.status} className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-sm`}
          />
          <span className="text-[12px] text-muted-foreground font-medium">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
});
