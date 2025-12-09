import { BarChart3 } from "lucide-react";

export function StatsHeader() {
  return (
    <div className="h-full w-full flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25">
        <BarChart3 size={20} className="text-white" />
      </div>
      <div>
        <h1 className="font-semibold text-xl text-slate-900 tracking-tight">
          Statistics Overview
        </h1>
        <p className="text-sm text-slate-500">Track your security awareness progress</p>
      </div>
    </div>
  );
}

export default StatsHeader;
