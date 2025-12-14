import { memo } from "react";
import { TimelineBar } from "./TimelineBar";
import type { WeekRange } from "./TimelineHeader";
import type { TimelineCampaign } from "./TimelineView";
import { Mail, MousePointer, Eye } from "lucide-react";

interface TimelineRowProps {
  campaign: TimelineCampaign;
  weeks: WeekRange[];
  monthStart: Date;
  monthEnd: Date;
  campaignColumnWidth: number;
}

export const TimelineRow = memo(function TimelineRow({
  campaign,
  weeks,
  monthStart,
  monthEnd,
  campaignColumnWidth,
}: TimelineRowProps) {
  // Calcular a posição da barra
  const start = new Date(campaign.begin_date);
  const end = new Date(campaign.end_date);
  const totalDuration = monthEnd.getTime() - monthStart.getTime();

  // Percentagem inicial (onde começa a barra)
  let startPercent =
    ((start.getTime() - monthStart.getTime()) / totalDuration) * 100;

  // Percentagem da largura (duração)
  let widthPercent = ((end.getTime() - start.getTime()) / totalDuration) * 100;

  // Ajustes para não sair dos limites visuais do mês atual
  if (start < monthStart) {
    const overflow =
      ((monthStart.getTime() - start.getTime()) / totalDuration) * 100;
    widthPercent -= overflow;
    startPercent = 0;
  }

  // Garantir limites
  if (startPercent < 0) startPercent = 0;
  if (startPercent + widthPercent > 100) widthPercent = 100 - startPercent;

  return (
    <div className="flex h-16 group hover:bg-slate-50 transition-colors">
      {/* Coluna Fixa: Informação da Campanha */}
      <div
        className="flex-shrink-0 p-3 border-r border-slate-100 flex flex-col justify-center gap-1.5 bg-white/50 backdrop-blur-sm z-10 sticky left-0"
        style={{ width: campaignColumnWidth }}
      >
        <div
          className="font-medium text-slate-700 text-sm truncate"
          title={campaign.name}
        >
          {campaign.name}
        </div>

        {/* Stats Row (Agora usando os campos flat do backend) */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1" title="Sent">
            <Mail size={12} />
            <span>{campaign.total_sent ?? 0}</span>
          </div>
          <div className="flex items-center gap-1" title="Opened">
            <Eye size={12} />
            <span>{campaign.total_opened ?? 0}</span>
          </div>
          <div className="flex items-center gap-1" title="Clicked">
            <MousePointer size={12} />
            <span>{campaign.total_clicked ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Área da Timeline */}
      <div className="flex-1 relative">
        {/* Grid Lines de Fundo */}
        <div className="absolute inset-0 flex pointer-events-none">
          {weeks.map((week) => (
            <div
              key={week.weekNumber}
              className="flex-1 border-r border-slate-100/60 last:border-r-0"
            />
          ))}
        </div>

        {/* A Barra Colorida */}
        <div className="absolute inset-0 mx-2">
          <TimelineBar
            startPercent={startPercent}
            widthPercent={widthPercent}
            status={campaign.status}
            dateLabel={new Date(campaign.begin_date).toLocaleDateString(
              undefined,
              {
                month: "short",
                day: "numeric",
              }
            )}
          />
        </div>
      </div>
    </div>
  );
});
