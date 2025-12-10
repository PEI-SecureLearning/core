import React from "react";
import { Clock, BookOpen } from "lucide-react";

interface ThisWeekProps {
  hours: number;
  modules: number;
}

const ThisWeek: React.FC<ThisWeekProps> = ({ hours, modules }) => {
  return (
    <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-800">This Week</h3>
        <div className="p-2 rounded-xl bg-blue-500/10">
          <Clock size={18} className="text-blue-600" />
        </div>
      </div>

      {/* Stats Display */}
      <div className="flex items-center justify-center gap-6">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={20} className="text-purple-500" />
            <span className="text-4xl font-bold text-slate-800">{hours}</span>
          </div>
          <span className="text-[13px] text-slate-500 font-medium">hours</span>
        </div>

        {/* Divider */}
        <div className="h-14 w-[3px] rounded-full bg-gradient-to-b from-purple-400 to-purple-600" />

        {/* Modules */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} className="text-purple-500" />
            <span className="text-4xl font-bold text-slate-800">{modules}</span>
          </div>
          <span className="text-[13px] text-slate-500 font-medium">modules</span>
        </div>
      </div>
    </div>
  );
};

export default ThisWeek;
