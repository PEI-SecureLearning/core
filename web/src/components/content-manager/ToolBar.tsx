import { Search, SortAsc, Plus } from "lucide-react";

interface ToolbarProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    sortValue?: string;
    onSortChange?: (value: string) => void;
    onAddClick?: () => void;
}

export function Toolbar({
    searchPlaceholder = "Search courses...",
    searchValue = "",
    onSearchChange,
    sortValue = "title",
    onSortChange,
    onAddClick,
}: ToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between" >
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-800" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-200/30 text-gray-800 placeholder:text-gray-400/50"
                />
            </div>

            <div className="relative flex flex-row space-x-4">
                <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                <select
                    value={sortValue}
                    onChange={(e) => onSortChange?.(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-200/30 cursor-pointer text-gray-500"
                >
                    <option value="title" className="text-gray-800">Sort by Name</option>
                    <option value="id" className="text-gray-800">Newest First</option>
                </select>
                <button
                    type="button"
                    onClick={onAddClick}
                    className="bg-white border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-200/30 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div >
    )
}
