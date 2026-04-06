import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar, Clock, CalendarDays, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCampaign } from "./CampaignContext";
import CampaignSummary from "./CampaignSummary";

const inputStyle = {
  background: "var(--surface)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid var(--border)"
};

export default function CampaignScheduler() {
  const { data, updateData } = useCampaign();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fromDate = data.begin_date?.split("T")[0];
    const toDate = data.end_date?.split("T")[0];

    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : undefined;
    const to = toDate ? new Date(`${toDate}T00:00:00`) : undefined;

    return from ? { from, to } : undefined;
  });
  const [beginTime, setBeginTime] = useState(
    data.begin_date?.split("T")[1]?.substring(0, 5) || ""
  );
  const [endTime, setEndTime] = useState(
    data.end_date?.split("T")[1]?.substring(0, 5) || ""
  );
  const [intervalMinutes, setIntervalMinutes] = useState(
    Math.floor(data.sending_interval_seconds / 60)
  );

  let dateRangeLabel: React.ReactNode;
  if (dateRange?.from) {
    dateRangeLabel = dateRange.to ? (
      <>
        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
      </>
    ) : (
      format(dateRange.from, "LLL dd, y")
    );
  } else {
    dateRangeLabel = <span className="text-muted-foreground">Pick a start and end date</span>;
  }

  // Update context when values change
  useEffect(() => {
    const beginDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null;
    const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null;

    updateData({
      begin_date: beginDate && beginTime ? `${beginDate}T${beginTime}:00` : null,
      end_date: endDate && endTime ? `${endDate}T${endTime}:00` : null
    });
  }, [dateRange, beginTime, endTime, updateData]);

  useEffect(() => {
    updateData({ sending_interval_seconds: intervalMinutes * 60 });
  }, [intervalMinutes, updateData]);

  return (
    <div className="h-full w-full flex flex-col md:flex-row gap-6 overflow-y-auto">
      {/* LEFT PANEL - Schedule Form */}
      <div
        className="flex flex-col gap-5 w-full md:w-1/2 p-5 rounded-2xl "
        style={{
          background: "color-mix(in srgb, var(--surface) 90%, transparent)",
          border: "1px solid var(--border)"
        }}
      >
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-primary/90" />
          <h2 className="text-[15px] font-medium text-foreground/90 tracking-tight">
            Schedule Campaign
          </h2>
        </div>

        {/* Date Range & Time */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[13px] font-medium text-muted-foreground">Date & Time</h3>
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="campaign-date-range"
                className="text-[11px] font-normal text-muted-foreground flex items-center gap-1.5 tracking-wide uppercase"
              >
                <Calendar size={12} />
                Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="campaign-date-range"
                    variant="outline"
                    className="h-auto w-full justify-start rounded-xl px-4 py-3 text-left text-[14px] font-normal"
                    style={inputStyle}
                  >
                    <Calendar size={14} className="mr-2 text-muted-foreground" />
                    {dateRangeLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    autoFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="campaign-begin-time"
                className="text-[11px] font-normal text-muted-foreground flex items-center gap-1.5 tracking-wide uppercase"
              >
                <Clock size={12} />
                Start Time
              </label>
              <input
                id="campaign-begin-time"
                type="time"
                value={beginTime}
                onChange={(e) => setBeginTime(e.target.value)}
                className="rounded-xl px-4 py-3 text-[14px] text-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <label
              htmlFor="campaign-end-time"
              className="text-[11px] font-normal text-muted-foreground flex items-center gap-1.5 tracking-wide uppercase"
            >
              <Clock size={12} />
              End Time
            </label>
            <input
              id="campaign-end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-xl px-4 py-3 text-[14px] text-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label
              htmlFor="campaign-interval-minutes"
              className="text-[11px] font-normal text-muted-foreground tracking-wide uppercase"
            >
              Interval (minutes)
            </label>
            <input
              id="campaign-interval-minutes"
              type="number"
              min="0"
              value={intervalMinutes}
              onChange={(e) =>
                setIntervalMinutes(
                  Math.max(0, Number.parseInt(e.target.value, 10) || 0)
                )
              }
              className="rounded-xl px-4 py-3 text-[14px] text-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
              style={inputStyle}
            />
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground/70 flex items-center gap-1.5">
          <Timer size={14} className="text-primary/90" />
          Emails will be sent every {intervalMinutes} minute{intervalMinutes === 1 ? "" : "s"}.
        </p>
      </div>

      {/* RIGHT PANEL - Summary Preview */}
      <CampaignSummary />
    </div>
  );
}
