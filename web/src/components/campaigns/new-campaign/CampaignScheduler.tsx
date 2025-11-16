import React, { useState } from "react";

interface ScheduleEntry {
  date: string;
  time: string;
}

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

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6 overflow-hidden">
      {/* LEFT PANEL */}
      <div className="flex flex-col gap-4 w-full md:w-1/3">
        <h2 className="text-lg font-medium">Schedule Campaign</h2>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <button
          onClick={handleAdd}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Add Event
        </button>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col w-full md:w-2/3 border-l-4 border-purple-700  p-4  overflow-y-auto">
        <h2 className="text-lg font-medium mb-4">Calendar</h2>

        {Object.keys(groupedEntries).length === 0 && (
          <p className="text-gray-500">No events scheduled</p>
        )}

        <div className="flex flex-col gap-4">
          {Object.keys(groupedEntries)
            .sort()
            .map((date) => (
              <div key={date} className="bg-white p-3 rounded border shadow-sm">
                <h3 className="font-semibold mb-2">{date}</h3>

                <ul className="flex flex-col gap-2">
                  {groupedEntries[date].map((entry, i) => (
                    <li
                      key={i}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded flex justify-between items-center"
                    >
                      <span>{entry.time}</span>
                      <button
                        onClick={() =>
                          handleRemove(
                            entries.findIndex(
                              (e) =>
                                e.date === entry.date && e.time === entry.time
                            )
                          )
                        }
                        className="text-purple-600 font-bold hover:text-purple-800"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
