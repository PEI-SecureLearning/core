import { Search, Grid3x3, TableProperties, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export default function SendingProfilesHeader({
  view,
  setView,
}: {
  view: "grid" | "table";
  setView: (v: "grid" | "table") => void;
}) {
  return (
    <div className="h-16 lg:h-20 w-full flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4">
      {/* Title */}
      <div className="flex-shrink-0">
        <h1 className="font-bold text-base sm:text-lg lg:text-xl text-gray-900">
          Sending Profiles
        </h1>
      </div>

      {/* Right side - Search, View Toggle, Create Button */}
      <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs lg:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search profiles..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* View Toggle */}
        <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-md transition-colors ${
              view === "grid"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            aria-label="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={`p-2 rounded-md transition-colors ${
              view === "table"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            aria-label="Table view"
          >
            <TableProperties className="h-4 w-4" />
          </button>
        </div>

        {/* Create Button */}
        <Link
          to="/sending-profiles/new"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Profile</span>
          <span className="sm:hidden">Create</span>
        </Link>
      </div>
    </div>
  );
}
