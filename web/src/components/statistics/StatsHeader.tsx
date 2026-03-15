import { BarChart3 } from "lucide-react";

export function StatsHeader() {
  return (
    <div className="h-full w-full flex items-center gap-2.5 sm:gap-3 min-w-0">
      <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25 shrink-0">
        <BarChart3 size={18} className="text-white sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0">
        <h1 className="font-semibold text-lg sm:text-xl text-foreground tracking-tight truncate">
          Statistics Overview
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">
          Track your security awareness progress
        </p>
      </div>
    </div>
  );
}

export default StatsHeader;
