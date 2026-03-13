import { Search, SortAsc, Plus } from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";

interface ToolbarProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    sortValue?: string;
    onSortChange?: (value: string) => void;
    onAddClick?: () => void;
    newTo?: string;
    newType?: string;
}

export function Toolbar({
    searchPlaceholder = "Search courses...",
    searchValue = "",
    onSearchChange,
    sortValue = "title",
    onSortChange,
    onAddClick,
    newTo,
    newType = "Item",
}: ToolbarProps) {
    const navigate = useNavigate();
    const pathname = useLocation({ select: (state) => state.pathname });

    const handleAddClick = () => {
        if (onAddClick) {
            onAddClick();
            return;
        }

        const basePath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
        const target = newTo ?? `${basePath}/new`;
        navigate({ to: target as never }).catch(() => undefined);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between" >
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78BFA]" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 text-foreground placeholder:text-muted-foreground"
                />
            </div>

            <div className="relative flex flex-row space-x-4">
                <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78BFA] pointer-events-none" />
                <select
                    value={sortValue}
                    onChange={(e) => onSortChange?.(e.target.value)}
                    className="bg-surface border border-border rounded-lg py-2 pl-10 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 cursor-pointer text-muted-foreground"
                >
                    <option value="title">Sort by Name</option>
                    <option value="id">Newest First</option>
                </select>
                <button
                    type="button"
                    onClick={handleAddClick}
                    className="flex items-center gap-1.5 text-white border-0 rounded-lg py-2 px-4 text-sm font-semibold transition-all shadow-md shadow-[#7C3AED]/25 hover:shadow-[#7C3AED]/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}
                >
                    <span className="inline-flex items-center gap-1.5">
                        <Plus className="w-4 h-4" />
                        <span>New {newType}</span>
                    </span>
                </button>
            </div>
        </div >
    )
}
