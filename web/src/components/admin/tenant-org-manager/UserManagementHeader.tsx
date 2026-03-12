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
        <div className="h-16 lg:h-20 w-full flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4 border-b border-border flex-shrink-0">
            <div className="flex-shrink-0">
                <h1 className="font-bold text-base sm:text-lg lg:text-xl text-foreground">
                    User Management
                </h1>
            </div>

            <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
                <div className="relative flex-1 max-w-xs lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-border/60 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                    />
                </div>

                <div className="hidden sm:flex items-center bg-muted rounded-md p-1">
                    <button
                        onClick={() => setView("table")}
                        className={`p-2 rounded-md transition-colors ${view === "table"
                                ? "bg-background text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            } cursor-pointer`}
                        aria-label="Table view"
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setView("grid")}
                        className={`p-2 rounded-md transition-colors ${view === "grid"
                                ? "bg-background text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            } cursor-pointer`}
                        aria-label="Grid view"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 border border-border/60 text-foreground/90 rounded-lg hover:bg-surface-subtle transition-colors font-medium text-sm cursor-pointer"
                >
                    <Upload className="h-4 w-4" />
                    <span className="hidden lg:inline">Bulk Import</span>
                </button>

                <button
                    onClick={onNewUser}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-md hover:bg-primary transition-colors font-medium text-sm whitespace-nowrap cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New User</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>
        </div>
    );
}
