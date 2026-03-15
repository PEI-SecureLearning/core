import { Upload, Plus } from "lucide-react";
import { RefObject } from "react";
import DisplayModeToggle from "@/components/shared/DisplayModeToggle";
import SearchBar from "@/components/shared/SearchBar";

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
}: Readonly<UserManagementHeaderProps>) {
    return (
        <div className="w-full flex flex-col gap-6 px-4 sm:px-6 lg:px-8 pt-8 pb-4 shrink-0">
            <div className="shrink-0">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    User Management
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                    Manage users, roles, and organization access.
                </p>
            </div>

            <div className="flex flex-row items-center gap-2 sm:gap-3">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search users..."
                    className="grow"
                    iconClassName="text-primary"
                    inputClassName="h-10 rounded-md border-border/60"
                />

                <DisplayModeToggle
                    value={view}
                    onChange={setView}
                    options={[
                        { value: "table", ariaLabel: "Table view", icon: "table" },
                        { value: "grid", ariaLabel: "Grid view", icon: "grid" },
                    ]}
                />

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
