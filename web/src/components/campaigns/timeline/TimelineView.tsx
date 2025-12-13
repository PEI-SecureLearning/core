import { memo, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TimelineLegend } from "./TimelineLegend";
import { TimelineGrid } from "./TimelineGrid";
import { type WeekRange } from "./TimelineHeader";

// Importamos o tipo centralizado para não haver confusões
import { type Campaign } from "@/services/campaignsApi";

// View period type
export type ViewPeriod = "week" | "month" | "year";

// Re-exportamos com o nome que o TimelineView estava a usar para não partir tudo,
// mas agora ele estende a interface real do backend.
export type TimelineCampaign = Campaign;

interface TimelineViewProps {
  campaigns: TimelineCampaign[];
}

function getWeeksInMonth(year: number, month: number): WeekRange[] {
  const weeks: WeekRange[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let currentDate = new Date(firstDay);
  let weekNumber = 1;

  while (currentDate <= lastDay) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    const daysUntilSaturday = 6 - weekEnd.getDay();
    weekEnd.setDate(weekEnd.getDate() + daysUntilSaturday);

    if (weekEnd > lastDay) {
      weekEnd.setTime(lastDay.getTime());
    }

    const formatDay = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    weeks.push({
      weekNumber,
      startDate: weekStart,
      endDate: weekEnd,
      label: `Week ${weekNumber}`,
      dateRange: `${formatDay(weekStart).split(" ")[1]}-${formatDay(weekEnd).split(" ")[1]}`,
    });

    currentDate = new Date(weekEnd);
    currentDate.setDate(currentDate.getDate() + 1);
    weekNumber++;
  }

  return weeks;
}

function getMonthsInYear(year: number): WeekRange[] {
  const months: WeekRange[] = [];

  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    months.push({
      weekNumber: month + 1,
      startDate: monthStart,
      endDate: monthEnd,
      label: monthStart.toLocaleDateString("en-US", { month: "short" }),
      dateRange: "",
    });
  }

  return months;
}

function getDaysInWeek(date: Date): WeekRange[] {
  const days: WeekRange[] = [];
  const dayOfWeek = date.getDay();
  const firstDay = new Date(date);
  firstDay.setDate(date.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDay);
    day.setDate(firstDay.getDate() + i);

    days.push({
      weekNumber: i + 1,
      startDate: new Date(day),
      endDate: new Date(day.setHours(23, 59, 59, 999)),
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      dateRange: day.toLocaleDateString("en-US", { day: "numeric" }),
    });
  }

  return days;
}

export const TimelineView = memo(function TimelineView({
  campaigns,
}: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>("month");

  const { weeks, periodStart, periodEnd, periodLabel } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewPeriod === "week") {
      const dayOfWeek = currentDate.getDay();
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return {
        weeks: getDaysInWeek(currentDate),
        periodStart: weekStart,
        periodEnd: weekEnd,
        periodLabel: `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      };
    } else if (viewPeriod === "year") {
      return {
        weeks: getMonthsInYear(year),
        periodStart: new Date(year, 0, 1),
        periodEnd: new Date(year, 11, 31, 23, 59, 59, 999),
        periodLabel: `${year}`,
      };
    } else {
      return {
        weeks: getWeeksInMonth(year, month),
        periodStart: new Date(year, month, 1),
        periodEnd: new Date(year, month + 1, 0, 23, 59, 59, 999),
        periodLabel: currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      };
    }
  }, [currentDate, viewPeriod]);

  const navigatePeriod = (direction: -1 | 1) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewPeriod === "week") {
        next.setDate(next.getDate() + direction * 7);
      } else if (viewPeriod === "year") {
        next.setFullYear(next.getFullYear() + direction);
      } else {
        next.setMonth(next.getMonth() + direction);
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col flex-1 min-h-0">
      {/* Controls Row */}
      <div className="h-[7%] flex items-center justify-between mb-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigatePeriod(-1)}
            className="p-2 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <ChevronLeft size={20} className="text-slate-500" />
          </button>
          <span className="text-[15px] font-semibold text-slate-700 min-w-[180px] text-center">
            {periodLabel}
          </span>
          <button
            onClick={() => navigatePeriod(1)}
            className="p-2 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <ChevronRight size={20} className="text-slate-500" />
          </button>
        </div>

        {/* View Period Toggle */}
        <div className="flex items-center gap-4">
          <div
            className="inline-flex rounded-xl p-1 shadow-lg shadow-slate-200/30"
            style={{
              background: "rgba(255, 255, 255, 0.27)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(77, 76, 76, 0.06)",
            }}
          >
            {(["week", "month", "year"] as ViewPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setViewPeriod(period)}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer capitalize ${
                  viewPeriod === period
                    ? "bg-white shadow-md text-purple-600"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Legend */}
          <TimelineLegend />
        </div>
      </div>

      {/* Timeline Grid - Full Height */}
      <div className="h-[93%] flex-1 min-h-0">
        <TimelineGrid
          campaigns={campaigns}
          weeks={weeks}
          monthStart={periodStart}
          monthEnd={periodEnd}
        />
      </div>
    </div>
  );
});
