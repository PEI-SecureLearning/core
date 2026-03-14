import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import DisplayModeToggle from "@/components/shared/DisplayModeToggle";
import SearchBar from "@/components/shared/SearchBar";

interface PhishingKitsHeaderProps {
  readonly viewMode: "grid" | "table";
  readonly setViewMode: (mode: "grid" | "table") => void;
  readonly onNewKit: () => void;
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
}

export function PhishingKitsHeader({
  viewMode,
  setViewMode,
  onNewKit,
  searchQuery,
  setSearchQuery,
}: PhishingKitsHeaderProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col justify-between gap-4">
        {/* Title Section */}
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Phishing Kits
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your phishing scenarios.
          </p>
        </div>

        {/* Actions Section */}
        <div className="flex flex-row items-center gap-3">
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search kits..."
            className="grow"
            iconClassName="text-primary"
            inputClassName="h-10 rounded-md border-border/60"
          />

          {/* View Toggle */}
          <DisplayModeToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "table", ariaLabel: "Table view", icon: "table" },
              { value: "grid", ariaLabel: "Grid view", icon: "grid" },
            ]}
          />

          <div className="flex items-center gap-2">

            <Button
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors h-10 px-4"
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
