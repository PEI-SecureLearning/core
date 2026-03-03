import { Search, LayoutList, LayoutGrid, Grid3x3 } from 'lucide-react'

const DIFFICULTY_OPTIONS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const

export type GridCols = 1 | 2 | 3

const colOptions: { cols: GridCols; icon: React.ReactNode; label: string }[] = [
    { cols: 1, icon: <LayoutList size={15} />, label: '1 column' },
    { cols: 2, icon: <LayoutGrid size={15} />, label: '2 columns' },
    { cols: 3, icon: <Grid3x3 size={15} />, label: '3 columns' },
]

type CourseFiltersProps = {
    search: string
    difficulty: string
    category: string
    categoryOptions: string[]
    cols: GridCols
    onSearchChange: (value: string) => void
    onDifficultyChange: (value: string) => void
    onCategoryChange: (value: string) => void
    onColsChange: (cols: GridCols) => void
    resultCount: number
}

export default function CourseFilters({
    search,
    difficulty,
    category,
    categoryOptions,
    cols,
    onSearchChange,
    onDifficultyChange,
    onCategoryChange,
    onColsChange,
    resultCount,
}: CourseFiltersProps) {
    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search courses…"
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                    />
                </div>

                {/* Difficulty filter */}
                <select
                    value={difficulty}
                    onChange={e => onDifficultyChange(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700"
                >
                    {DIFFICULTY_OPTIONS.map(d => (
                        <option key={d} value={d}>
                            {d === 'All' ? 'All Difficulties' : d}
                        </option>
                    ))}
                </select>

                {/* Category filter */}
                <select
                    value={category}
                    onChange={e => onCategoryChange(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700"
                >
                    {categoryOptions.map(c => (
                        <option key={c} value={c}>
                            {c === 'All' ? 'All Categories' : c}
                        </option>
                    ))}
                </select>

                {/* Column toggle */}
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-1">
                    {colOptions.map(opt => (
                        <button
                            key={opt.cols}
                            onClick={() => onColsChange(opt.cols)}
                            title={opt.label}
                            className={`p-1.5 rounded-md transition-colors duration-150 ${cols === opt.cols
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {opt.icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            <p className="text-xs text-gray-400">
                {resultCount} course{resultCount !== 1 ? 's' : ''} found
            </p>
        </div>
    )
}
