import { useState, useRef, useCallback } from 'react'
import { BookOpen } from 'lucide-react'
import { COURSES } from './courseData'
import type { Course } from './courseData'
import CourseCard from './CourseCard'
import CourseFilters from './CourseFilters'
import type { GridCols } from './CourseFilters'

export type { Course }

const CATEGORY_OPTIONS = ['All', ...Array.from(new Set(COURSES.map(c => c.category)))]

const gridClass: Record<GridCols, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

export default function CourseList() {
    const [search, setSearch] = useState('')
    const [difficulty, setDifficulty] = useState('All')
    const [category, setCategory] = useState('All')
    const [cols, setCols] = useState<GridCols>(2)
    const [headerVisible, setHeaderVisible] = useState(true)

    const scrollRef = useRef<HTMLDivElement>(null)
    const lastScrollY = useRef(0)

    const handleScroll = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        const current = el.scrollTop
        const delta = current - lastScrollY.current

        // Only react to intentional scrolls (> 4px) to avoid jitter
        if (Math.abs(delta) > 4) {
            setHeaderVisible(delta < 0 || current < 10)
            lastScrollY.current = current
        }
    }, [])

    const filtered = COURSES.filter(course => {
        const matchesSearch =
            course.title.toLowerCase().includes(search.toLowerCase()) ||
            course.description.toLowerCase().includes(search.toLowerCase())
        const matchesDifficulty = difficulty === 'All' || course.difficulty === difficulty
        const matchesCategory = category === 'All' || course.category === category
        return matchesSearch && matchesDifficulty && matchesCategory
    })

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="relative h-full overflow-y-auto"
        >
            {/* ── Sticky header + filters ───────────────────────────────── */}
            <div
                className={`sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 pt-6 pb-4 space-y-4 transition-all duration-500 ease-in-out ${headerVisible
                    ? 'opacity-100 translate-y-0 shadow-none'
                    : 'opacity-0 -translate-y-full pointer-events-none shadow-md'
                    }`}
            >
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Browse and complete security training courses assigned to your organization.
                    </p>
                </div>

                {/* Search & Filters */}
                <CourseFilters
                    search={search}
                    difficulty={difficulty}
                    category={category}
                    categoryOptions={CATEGORY_OPTIONS}
                    cols={cols}
                    onSearchChange={setSearch}
                    onDifficultyChange={setDifficulty}
                    onCategoryChange={setCategory}
                    onColsChange={setCols}
                    resultCount={filtered.length}
                />
            </div>

            {/* ── Course grid ───────────────────────────────────────────── */}
            <div className="px-6 pt-4 pb-6">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                        <BookOpen size={48} className="mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No courses found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className={`grid ${gridClass[cols]} gap-6`}>
                        {filtered.map(course => (
                            <CourseCard key={course.id} course={course} cols={cols} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}