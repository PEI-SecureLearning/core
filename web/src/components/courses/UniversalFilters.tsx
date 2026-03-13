import { Search, LayoutList, LayoutGrid, Grid3x3, X } from 'lucide-react'

export type GridCols = 1 | 2 | 3

const colOptions: { cols: GridCols; icon: React.ReactNode; label: string }[] = [
    { cols: 1, icon: <LayoutList size={15} />, label: 'List view' },
    { cols: 2, icon: <LayoutGrid size={15} />, label: '2 columns' },
    { cols: 3, icon: <Grid3x3 size={15} />, label: '3 columns' },
]

interface FilterProps<T extends string> {
    search: string
    onSearchChange: (value: string) => void

    // Primary Filter (e.g., Difficulty)
    primaryFilterValue: T
    primaryFilterOptions: readonly T[]
    onPrimaryFilterChange: (value: T) => void
    primaryLabel?: string

    // Secondary Filter (e.g., Category)
    secondaryFilterValue: string
    secondaryFilterOptions: string[]
    onSecondaryFilterChange: (value: string) => void
    secondaryLabel?: string

    // Layout
    cols: GridCols
    onColsChange: (cols: GridCols) => void

    // Metadata
    resultCount: number
    entityName?: string // "course", "module", "lesson"
}

export default function UniversalFilters<T extends string>({
    search,
    onSearchChange,
    primaryFilterValue,
    primaryFilterOptions,
    onPrimaryFilterChange,
    primaryLabel = "All",
    secondaryFilterValue,
    secondaryFilterOptions,
    onSecondaryFilterChange,
    secondaryLabel = "All Categories",
    cols,
    onColsChange,
    resultCount,
    entityName = "item",
}: FilterProps<T>) {

    const handleClear = () => onSearchChange('');

    return (
        <div className="space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={16} />
                    <input
                        type="text"
                        placeholder={`Search ${entityName}s...`}
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background transition-all"
                    />
                    {search && (
                        <button
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    {/* Primary Filter */}
                    <select
                        value={primaryFilterValue}
                        onChange={e => onPrimaryFilterChange(e.target.value as T)}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground/90 cursor-pointer"
                    >
                        {primaryFilterOptions.map(opt => (
                            <option key={opt} value={opt}>
                                {opt === 'All' ? primaryLabel : opt}
                            </option>
                        ))}
                    </select>

                    {/* Secondary Filter */}
                    <select
                        value={secondaryFilterValue}
                        onChange={e => onSecondaryFilterChange(e.target.value)}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground/90 cursor-pointer"
                    >
                        {secondaryFilterOptions.map(opt => (
                            <option key={opt} value={opt}>
                                {opt === 'All' ? secondaryLabel : opt}
                            </option>
                        ))}
                    </select>

                    {/* Column toggle */}
                    <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border bg-background px-1">
                        {colOptions.map(opt => (
                            <button
                                key={opt.cols}
                                onClick={() => onColsChange(opt.cols)}
                                title={opt.label}
                                className={`p-1.5 rounded-md transition-all ${cols === opt.cols
                                    ? 'bg-primary/20 text-primary shadow-sm'
                                    : 'text-muted-foreground/70 hover:text-muted-foreground hover:bg-surface-subtle'
                                    }`}
                            >
                                {opt.icon}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results count */}
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {resultCount} {resultCount === 1 ? entityName : `${entityName}s`} found
            </p>
        </div>
    )
}