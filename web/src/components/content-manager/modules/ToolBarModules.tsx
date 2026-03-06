import { Search, SortAsc } from "lucide-react";

export type ModuleSortValue = 'newest' | 'oldest' | 'title_asc' | 'title_desc'

interface ToolbarModulesProps {
    readonly searchValue:    string
    readonly onSearchChange: (v: string) => void
    readonly sortValue:      ModuleSortValue
    readonly onSortChange:   (v: ModuleSortValue) => void
}

export function ToolbarModules({
    searchValue,
    onSearchChange,
    sortValue,
    onSortChange,
}: ToolbarModulesProps) {
    return (
        <div className="flex flex-row items-center gap-4">
            <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-800" />
                <input
                    type="text"
                    value={searchValue}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="Search modules..."
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-200/30 text-gray-800 placeholder:text-gray-400/50"
                />
            </div>

            <div className="relative">
                <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                <select
                    value={sortValue}
                    onChange={e => onSortChange(e.target.value as ModuleSortValue)}
                    className="bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-200/30 cursor-pointer text-gray-500"
                >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title_asc">Name A → Z</option>
                    <option value="title_desc">Name Z → A</option>
                </select>
            </div>
        </div>
    )
}
