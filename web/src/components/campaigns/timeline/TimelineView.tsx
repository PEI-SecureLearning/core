import { memo, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TimelineLegend } from "./TimelineLegend";
import { TimelineGrid } from "./TimelineGrid";
import type { WeekRange } from "./TimelineHeader";

// Minimal interface for timeline - compatible with various Campaign types
export interface TimelineCampaign {
    id: string;
    name: string;
    begin_date: string;
    end_date: string;
    status: "active" | "completed" | "scheduled" | "paused" | "failed";
    stats: { sent: number; opened: number; clicked: number };
}

interface TimelineViewProps {
    campaigns: TimelineCampaign[];
}

function getWeeksInMonth(year: number, month: number): WeekRange[] {
    const weeks: WeekRange[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start from the first day of the month
    let currentDate = new Date(firstDay);
    let weekNumber = 1;

    while (currentDate <= lastDay) {
        const weekStart = new Date(currentDate);

        // Find end of week (Saturday) or end of month
        const weekEnd = new Date(currentDate);
        const daysUntilSaturday = 6 - weekEnd.getDay();
        weekEnd.setDate(weekEnd.getDate() + daysUntilSaturday);

        // Clamp to end of month
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

        // Move to next week (Sunday)
        currentDate = new Date(weekEnd);
        currentDate.setDate(currentDate.getDate() + 1);
        weekNumber++;
    }

    return weeks;
}

export const TimelineView = memo(function TimelineView({
    campaigns,
}: TimelineViewProps) {
    const [currentDate, setCurrentDate] = useState(() => new Date());

    const { weeks, monthStart, monthEnd, monthLabel } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        return {
            weeks: getWeeksInMonth(year, month),
            monthStart: new Date(year, month, 1),
            monthEnd: new Date(year, month + 1, 0, 23, 59, 59, 999),
            monthLabel: currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            }),
        };
    }, [currentDate]);

    const navigateMonth = (direction: -1 | 1) => {
        setCurrentDate((prev) => {
            const next = new Date(prev);
            next.setMonth(next.getMonth() + direction);
            return next;
        });
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Controls Row */}
            <div className="flex items-center justify-between mb-4">
                {/* Month Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 rounded-lg hover:bg-slate-100/80 transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-500" />
                    </button>
                    <span className="text-[15px] font-semibold text-slate-700 min-w-[140px] text-center">
                        {monthLabel}
                    </span>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 rounded-lg hover:bg-slate-100/80 transition-colors"
                    >
                        <ChevronRight size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Legend */}
                <TimelineLegend />
            </div>

            {/* Timeline Grid - Full Height */}
            <div className="flex-1 min-h-0">
                <TimelineGrid
                    campaigns={campaigns}
                    weeks={weeks}
                    monthStart={monthStart}
                    monthEnd={monthEnd}
                />
            </div>
        </div>
    );
});
