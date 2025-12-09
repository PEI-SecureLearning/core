import { useState } from "react";
import { Calendar, Clock, Plus, X, CalendarDays } from "lucide-react";

interface ScheduleEntry {
  date: string;
  time: string;
}

const inputStyle = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
};

export default function CampaignScheduler() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleAdd = () => {
    if (!date || !time) return;
    setEntries([...entries, { date, time }]);
    setDate("");
    setTime("");
  };

  const handleRemove = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const groupedEntries: Record<string, ScheduleEntry[]> = {};
  entries.forEach((entry) => {
    if (!groupedEntries[entry.date]) groupedEntries[entry.date] = [];
    groupedEntries[entry.date].push(entry);
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <div className="h-full w-full flex flex-col md:flex-row gap-6 overflow-hidden">
      {/* LEFT PANEL - Schedule Form */}
      <div
        className="flex flex-col gap-5 w-full md:w-1/3 p-5 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
        }}
      >
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-purple-500" />
          <h2 className="text-[15px] font-medium text-slate-700 tracking-tight">Schedule Campaign</h2>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-normal text-slate-500 flex items-center gap-1.5 tracking-wide uppercase">
            <Calendar size={12} />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl px-4 py-3 text-[14px] text-slate-700 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-full"
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-normal text-slate-500 flex items-center gap-1.5 tracking-wide uppercase">
            <Clock size={12} />
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-xl px-4 py-3 text-[14px] text-slate-700 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-full"
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!date || !time}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[14px] font-medium text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          style={{
            background: date && time ? 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' : 'rgba(148, 163, 184, 0.4)',
            boxShadow: date && time ? '0 4px 14px rgba(147, 51, 234, 0.25)' : 'none'
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Schedule
        </button>
      </div>

      {/* RIGHT PANEL - Calendar View */}
      <div
        className="flex flex-col flex-1 p-5 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-purple-500" />
          <h2 className="text-[15px] font-medium text-slate-700 tracking-tight">Scheduled Events</h2>
          {entries.length > 0 && (
            <span className="ml-auto text-[12px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {entries.length} event{entries.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {Object.keys(groupedEntries).length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(147, 51, 234, 0.1)' }}
            >
              <CalendarDays size={28} className="text-purple-400" />
            </div>
            <p className="text-slate-500 text-[14px]">No events scheduled yet</p>
            <p className="text-slate-400 text-[13px] mt-1">Add a date and time to get started</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {Object.keys(groupedEntries)
              .sort()
              .map((dateKey) => (
                <div
                  key={dateKey}
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                  }}
                >
                  <h3 className="text-[13px] font-medium text-slate-600 mb-3 flex items-center gap-2">
                    <Calendar size={14} className="text-purple-500" />
                    {formatDate(dateKey)}
                  </h3>

                  <div className="flex flex-col gap-2">
                    {groupedEntries[dateKey].map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-150 group"
                        style={{
                          background: 'rgba(147, 51, 234, 0.08)',
                          border: '1px solid rgba(147, 51, 234, 0.15)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-purple-500" />
                          <span className="text-[14px] font-medium text-purple-700">
                            {formatTime(entry.time)}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleRemove(
                              entries.findIndex(
                                (e) =>
                                  e.date === entry.date && e.time === entry.time
                              )
                            )
                          }
                          className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-purple-200/50 transition-all duration-150"
                        >
                          <X size={14} className="text-purple-600" strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
