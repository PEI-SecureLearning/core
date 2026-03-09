import React, { useState } from "react";

interface ThisWeekProps {
  hours: number;
  modules: number;
}

const ThisWeek: React.FC<ThisWeekProps> = ({ hours, modules }) => {
  const [hovered, setHovered] = useState<"hours" | "modules" | null>(null);

  return (
    <div
      className="flex-1 bg-white/60 backdrop-blur-xl rounded-b-xl border-t-3 border-purple-500 shadow-lg shadow-slate-300/50 p-5
        hover:shadow-2xl hover:shadow-purple-200/60 transition-all duration-500 hover:-translate-y-1 group"
      style={{ perspective: "800px" }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { text-shadow: 0 0 0px rgba(139, 92, 246, 0); }
          50% { text-shadow: 0 0 24px rgba(139, 92, 246, 0.4); }
        }
        @keyframes dividerPulse {
          0%, 100% { opacity: 0.6; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.05); }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .stat-number-hover {
          animation: pulseGlow 2s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        .divider-animated {
          animation: dividerPulse 2.5s ease-in-out infinite;
        }
        .card-icon-float {
          animation: floatUp 3s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[15px] font-semibold text-slate-800 tracking-tight">This Week</h3>
        </div>
        <span className="text-[11px] font-medium text-purple-500 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full
          group-hover:bg-purple-100 transition-colors duration-300">
          Active
        </span>
      </div>

      {/* Stats Display */}
      <div className="flex items-center justify-center gap-0 bg-gradient-to-br from-purple-50/80 to-indigo-50/50 rounded-2xl
        border border-purple-100/60 group-hover:border-purple-200/80 transition-all duration-300 overflow-hidden">

        {/* Hours */}
        <div
          className="flex-1 flex flex-col items-center py-5 px-4 cursor-default relative
            transition-all duration-300 rounded-l-2xl group/hours"
          onMouseEnter={() => setHovered("hours")}
          onMouseLeave={() => setHovered(null)}
        >
          <div className={`absolute inset-0 bg-purple-500/5 rounded-l-2xl transition-opacity duration-300 ${hovered === "hours" ? "opacity-100" : "opacity-0"}`} />

          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[11px] font-medium uppercase tracking-wider transition-colors duration-300 ${hovered === "hours" ? "text-purple-500" : "text-slate-400"}`}>
              Hours
            </span>
          </div>

          <span
            className={`text-7xl font-bold leading-none transition-all duration-300 ${hovered === "hours"
              ? "text-purple-600 scale-110 stat-number-hover"
              : "text-slate-600"
              }`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {hours}
          </span>

          <span className={`text-[12px] mt-1.5 font-medium transition-colors duration-300 ${hovered === "hours" ? "text-purple-400" : "text-slate-400"}`}>
            this week
          </span>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center py-4">
          <div className="h-[80px] w-[2px] rounded-full bg-gradient-to-b from-transparent via-purple-400 to-transparent divider-animated" />
        </div>

        {/* Modules */}
        <div
          className="flex-1 flex flex-col items-center py-5 px-4 cursor-default relative
            transition-all duration-300 rounded-r-2xl group/modules"
          onMouseEnter={() => setHovered("modules")}
          onMouseLeave={() => setHovered(null)}
        >
          <div className={`absolute inset-0 bg-indigo-500/5 rounded-r-2xl transition-opacity duration-300 ${hovered === "modules" ? "opacity-100" : "opacity-0"}`} />

          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[11px] font-medium uppercase tracking-wider transition-colors duration-300 ${hovered === "modules" ? "text-indigo-500" : "text-slate-400"}`}>
              Modules
            </span>
          </div>

          <span
            className={`text-7xl font-bold leading-none transition-all duration-300 ${hovered === "modules"
              ? "text-indigo-600 scale-110 stat-number-hover"
              : "text-slate-600"
              }`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {modules}
          </span>

          <span className={`text-[12px] mt-1.5 font-medium transition-colors duration-300 ${hovered === "modules" ? "text-indigo-400" : "text-slate-400"}`}>
            completed
          </span>
        </div>
      </div>

      {/* Bottom shimmer bar */}
      <div className="mt-3 h-1 rounded-full overflow-hidden bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400
            group-hover:from-purple-500 group-hover:via-indigo-500 group-hover:to-purple-500
            transition-all duration-500"
          style={{
            backgroundSize: "200% auto",
            animation: "shimmer 2.5s linear infinite",
          }}
        />
      </div>
    </div>
  );
};

export default ThisWeek;
