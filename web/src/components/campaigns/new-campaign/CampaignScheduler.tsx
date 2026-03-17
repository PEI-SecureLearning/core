import { useState, useEffect } from "react";
import { Calendar, Clock, CalendarDays, Timer } from "lucide-react";
import { useCampaign } from "./CampaignContext";

const inputStyle = {
  background: "var(--surface)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid var(--border)"
};

export default function CampaignScheduler() {
  const { data, updateData } = useCampaign();

  const [beginDate, setBeginDate] = useState(
    data.begin_date?.split("T")[0] || ""
  );
  const [beginTime, setBeginTime] = useState(
    data.begin_date?.split("T")[1]?.substring(0, 5) || ""
  );
  const [endDate, setEndDate] = useState(data.end_date?.split("T")[0] || "");
  const [endTime, setEndTime] = useState(
    data.end_date?.split("T")[1]?.substring(0, 5) || ""
  );
  const [intervalHours, setIntervalHours] = useState(
    Math.floor(data.sending_interval_seconds / 3600)
  );
  const [intervalMinutes, setIntervalMinutes] = useState(
    Math.floor((data.sending_interval_seconds % 3600) / 60)
  );

  // Update context when values change
  useEffect(() => {
    if (beginDate && beginTime) {
      updateData({ begin_date: `${beginDate}T${beginTime}:00` });
    }
  }, [beginDate, beginTime]);

  useEffect(() => {
    if (endDate && endTime) {
      updateData({ end_date: `${endDate}T${endTime}:00` });
    }
  }, [endDate, endTime]);

  useEffect(() => {
    const totalSeconds = intervalHours * 3600 + intervalMinutes * 60;
    updateData({ sending_interval_seconds: totalSeconds });
  }, [intervalHours, intervalMinutes]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = Number.parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  let intervalLabel = "";
  if (intervalMinutes > 0) {
    intervalLabel = `${intervalMinutes}m`;
  } else if (intervalHours === 0) {
    intervalLabel = "0m";
  }

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

        {/* Start Date & Time */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[13px] font-medium text-muted-foreground">
            Start
          </h3>
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="campaign-begin-date"
                className="text-[11px] font-normal text-muted-foreground flex items-center gap-1.5 tracking-wide uppercase"
              >
                <Calendar size={12} />
                Date
              </label>
              <input
                id="campaign-begin-date"
                type="date"
                value={beginDate}
                onChange={(e) => setBeginDate(e.target.value)}
                className="rounded-xl px-4 py-3 text-[14px] text-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="campaign-begin-time"
                className="text-[11px] font-normal text-muted-foreground flex items-center gap-1.5 tracking-wide uppercase"
              >
                <Clock size={12} />
                Time
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

        {/* End Date & Time */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[13px] font-medium text-muted-foreground">End</h3>
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="campaign-end-date"
                className="text-[11px] font-normal text-muted-foreground flex items-center gap-1.5 tracking-wide uppercase"
              >
                <Calendar size={12} />
                Date
              </label>
              <input
                id="campaign-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl px-4 py-3 text-[14px] text-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="campaign-end-time"
                className="text-[11px] font-normal text-muted-foreground flex items-center gap-1.5 tracking-wide uppercase"
              >
                <Clock size={12} />
                Time
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
          </div>
        </div>

        {/* Interval */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Timer size={14} className="text-primary/90" />
            Email Send Interval
          </h3>
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="campaign-interval-hours"
                className="text-[11px] font-normal text-muted-foreground tracking-wide uppercase"
              >
                Hours
              </label>
              <input
                id="campaign-interval-hours"
                type="number"
                min="0"
                value={intervalHours}
                onChange={(e) =>
                  setIntervalHours(
                    Math.max(0, Number.parseInt(e.target.value, 10) || 0)
                  )
                }
                className="rounded-xl px-4 py-3 text-[14px] text-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label
                htmlFor="campaign-interval-minutes"
                className="text-[11px] font-normal text-muted-foreground tracking-wide uppercase"
              >
                Minutes
              </label>
              <input
                id="campaign-interval-minutes"
                type="number"
                min="0"
                max="59"
                value={intervalMinutes}
                onChange={(e) =>
                  setIntervalMinutes(
                    Math.min(
                      59,
                      Math.max(0, Number.parseInt(e.target.value, 10) || 0)
                    )
                  )
                }
                className="rounded-xl px-4 py-3 text-[14px] text-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
                style={inputStyle}
              />
            </div>
          </div>
          <p className="text-[12px] text-muted-foreground/70">
            Emails will be sent every{" "}
            {intervalHours > 0 ? `${intervalHours}h ` : ""}
            {intervalLabel}
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - Summary Preview */}
      <div
        className="flex flex-col flex-1 p-5 rounded-2xl"
        style={{
          background: "color-mix(in srgb, var(--surface) 90%, transparent)",
          border: "1px solid var(--border)"
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-primary/90" />
          <h2 className="text-[15px] font-medium text-foreground/90 tracking-tight">
            Campaign Summary
          </h2>
        </div>

        <div className="flex-1 space-y-4">
          {/* Basic Info Summary */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "color-mix(in srgb, var(--surface) 94%, transparent)",
              border: "1px solid var(--border)"
            }}
          >
            <h3 className="text-[13px] font-medium text-muted-foreground mb-2">
              Basic Info
            </h3>
            <p className="text-[14px] text-foreground/90 font-medium">
              {data.name || (
                <span className="text-muted-foreground/70 italic">
                  No name set
                </span>
              )}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">
              {data.description || (
                <span className="italic">No description</span>
              )}
            </p>
          </div>

          {/* Phishing Kits Summary */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "color-mix(in srgb, var(--surface) 94%, transparent)",
              border: "1px solid var(--border)"
            }}
          >
            <h3 className="text-[13px] font-medium text-muted-foreground mb-2">
              Phishing Kits
            </h3>
            <div className="space-y-1">
              <p className="text-[12px] text-muted-foreground">
                {data.phishing_kit_ids.length > 0 ? (
                  <span className="text-primary font-medium">
                    {data.phishing_kit_ids.length} kit(s) selected
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    No kits selected
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Target Groups Summary */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "color-mix(in srgb, var(--surface) 94%, transparent)",
              border: "1px solid var(--border)"
            }}
          >
            <h3 className="text-[13px] font-medium text-muted-foreground mb-2">
              Target Groups
            </h3>
            <p className="text-[12px] text-muted-foreground">
              {data.user_group_ids.length > 0 ? (
                <span className="text-primary font-medium">
                  {data.user_group_ids.length} group(s) selected
                </span>
              ) : (
                <span className="text-muted-foreground">
                  No groups selected
                </span>
              )}
            </p>
          </div>

          {/* Schedule Summary */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "color-mix(in srgb, var(--surface) 94%, transparent)",
              border: "1px solid var(--border)"
            }}
          >
            <h3 className="text-[13px] font-medium text-muted-foreground mb-2">
              Schedule
            </h3>
            <div className="space-y-1">
              <p className="text-[12px] text-muted-foreground">
                Start:{" "}
                {beginDate && beginTime ? (
                  <span className="text-primary font-medium">
                    {formatDate(beginDate)} at {formatTime(beginTime)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </p>
              <p className="text-[12px] text-muted-foreground">
                End:{" "}
                {endDate && endTime ? (
                  <span className="text-primary font-medium">
                    {formatDate(endDate)} at {formatTime(endTime)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </p>
              <p className="text-[12px] text-muted-foreground">
                Interval:{" "}
                <span className="text-primary font-medium">
                  {data.sending_interval_seconds} seconds ({intervalHours}h{" "}
                  {intervalMinutes}m)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
