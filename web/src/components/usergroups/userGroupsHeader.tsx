import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import DisplayModeToggle from "@/components/shared/DisplayModeToggle";
import SearchBar from "@/components/shared/SearchBar";

export function UserGroupsHeader({
  view,
  setView,
}: Readonly<{
  view: 'grid' | 'table';
  setView: (v: 'grid' | 'table') => void;
}>) {

  return (
    <div className="w-full flex flex-col gap-6 px-4 sm:px-6 lg:px-8 pt-8 pb-4 shrink-0">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          User Groups
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Organize users into manageable access groups.
        </p>
      </div>

      <div className="flex flex-row items-center gap-2 sm:gap-3">
        {/* Search Bar */}
        <SearchBar
          placeholder="Search groups..."
          className="grow"
          iconClassName="text-primary"
          inputClassName="h-10 rounded-md border-border/60"
        />

        {/* View Toggle */}
        <DisplayModeToggle
          value={view}
          onChange={setView}
          options={[
            { value: "table", ariaLabel: "Table view", icon: "table" },
            { value: "grid", ariaLabel: "Grid view", icon: "grid" },
          ]}
        />

        {/* Create Button */}
        <Link
          id="create-new-group-link"
          to="/usergroups/new-group"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-medium text-sm whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create New Group</span>
          <span className="sm:hidden">Create</span>
        </Link>
      </div>
    </div>
  );
}

export default UserGroupsHeader;