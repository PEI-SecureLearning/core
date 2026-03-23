import { memo } from "react";
import { Settings2 } from "lucide-react";
import type { CampaignStatus } from "@/services/campaignsApi"; // Importa do serviço

interface TimelineBarProps {
  startPercent: number;
  widthPercent: number;
  status: CampaignStatus;
  dateLabel: string;
}

// Mapeamento atualizado para os status do Backend Python
const statusColors: Record<CampaignStatus, { bg: string; border: string }> = {
  running: {
    bg: "bg-info",
    border: "border-info/30",
  },
  scheduled: {
    bg: "bg-warning",
    border: "border-warning/30",
  },
  completed: {
    bg: "bg-success",
    border: "border-success/30",
  },
  canceled: {
    bg: "bg-muted-foreground/40", // Simplificado de gradiente para cor única
    border: "border-border/30",
  },
};

export const TimelineBar = memo(function TimelineBar({
  startPercent,
  widthPercent,
  status,
  dateLabel,
}: TimelineBarProps) {
  // Fallback para completed se vier um status estranho
  const colors = statusColors[status] || statusColors.completed;

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
        className="text-white/70 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
      />
    </div>
  );
});
