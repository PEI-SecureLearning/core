import { Search, List, LayoutGrid, Upload, Plus } from "lucide-react";
import { RefObject } from "react";

interface UserManagementHeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    view: "table" | "grid";
    setView: (view: "table" | "grid") => void;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onNewUser: () => void;
}

export function UserManagementHeader({
    searchQuery,
    setSearchQuery,
    view,
    setView,
    fileInputRef,
    onNewUser,
}: UserManagementHeaderProps) {
    return (
        <div className="h-16 lg:h-20 w-full flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex-shrink-0">
                <h1 className="font-bold text-base sm:text-lg lg:text-xl text-gray-900">
                    User Management
                </h1>
            </div>

            <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
                <div className="relative flex-1 max-w-xs lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                <div className="hidden sm:flex items-center bg-gray-100 rounded-md p-1">
                    <button
                        onClick={() => setView("table")}
                        className={`p-2 rounded-md transition-colors ${view === "table"
                                ? "bg-white text-purple-600 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            } cursor-pointer`}
                        aria-label="Table view"
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setView("grid")}
                        className={`p-2 rounded-md transition-colors ${view === "grid"
                                ? "bg-white text-purple-600 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            } cursor-pointer`}
                        aria-label="Grid view"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm cursor-pointer"
                >
                    <Upload className="h-4 w-4" />
                    <span className="hidden lg:inline">Bulk Import</span>
                </button>

                <button
                    onClick={onNewUser}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium text-sm whitespace-nowrap cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New User</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>
        </div>
    );
}
