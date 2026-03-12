import {
  Grid3x3,
  TableProperties,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhishingKitsHeaderProps {
  readonly viewMode: "grid" | "table";
  readonly setViewMode: (mode: "grid" | "table") => void;
  readonly onNewKit: () => void;
  readonly refetch: () => void;
  readonly isFetching: boolean;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
}

export function PhishingKitsHeader({
  viewMode,
  setViewMode,
  onNewKit,
  refetch,
  isFetching,
  searchQuery,
  setSearchQuery,
}: PhishingKitsHeaderProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col justify-between gap-4">
        {/* Title Section */}
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Phishing Kits
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your phishing scenarios.
          </p>
        </div>

        {/* Actions Section */}
        <div className="flex flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 h-10 rounded-xl bg-white/70 backdrop-blur-xl border-slate-200/60 focus-visible:ring-purple-500/20 focus-visible:border-purple-400"
              placeholder="Search kits..."
            />
          </div>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100/80 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-all duration-200",
                viewMode === "grid"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
              aria-label="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-2 rounded-md transition-all duration-200",
                viewMode === "table"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
              aria-label="Table view"
            >
              <TableProperties className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={refetch}
              className="h-10 w-10 shrink-0 border-slate-200/60 bg-white/70"
              disabled={isFetching}
              title="Refresh"
            >
              <RefreshCcw
                size={16}
                className={cn("transition", isFetching && "animate-spin")}
              />
            </Button>

            <Button
              className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-600 transition-colors h-10 px-4"
              onClick={onNewKit}
            >
              <Plus size={16} />
              <span className="hidden lg:inline">New Kit</span>
              <span className="lg:hidden">New</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
