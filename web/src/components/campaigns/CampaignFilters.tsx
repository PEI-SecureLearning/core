import { Filter } from "lucide-react";
import SearchBar from "@/components/shared/SearchBar";

interface CampaignFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: string;
    onStatusFilterChange: (status: string) => void;
}

export function CampaignFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
}: Readonly<CampaignFiltersProps>) {
    return (
        <div className="flex items-center gap-4">
            <SearchBar
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search campaigns..."
                className="flex-1 max-w-md"
                iconClassName="text-primary"
                inputClassName="h-10 rounded-lg border-border/60"
            />
            <div className="flex items-center gap-2">
                <Filter size={20} className="text-muted-foreground/70" />
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="px-3 py-2 border border-border/60 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-transparent outline-none bg-background"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>
            </div>
        </div>
    );
}
