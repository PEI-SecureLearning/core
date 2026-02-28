import { Link } from '@tanstack/react-router'
import { Clock, BarChart2, Users } from 'lucide-react'
import type { Course } from './courseData'
import type { GridCols } from './CourseFilters'

const difficultyColor: Record<string, string> = {
    Beginner: 'bg-emerald-100 text-emerald-800',
    Intermediate: 'bg-amber-100 text-amber-800',
    Advanced: 'bg-red-100 text-red-800',
}

type CourseCardProps = {
    course: Course
    cols: GridCols
}

// ─── shared progress badge helpers ───────────────────────────────────────────

function ProgressBadge({ progress }: { progress: number }) {
    if (progress === 100)
        return <span className="text-xs text-emerald-300 font-semibold">✓ Completed</span>
    if (progress > 0)
        return <span className="text-xs text-white/80 font-medium">{progress}%</span>
    return null
}

function ProgressBar({ progress, color = 'bg-purple-500' }: { progress: number; color?: string }) {
    if (progress === 0) return null
    return (
        <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
                className={`h-full rounded-full ${color} transition-all duration-500`}
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}

// ─── 1-col: wide horizontal card ─────────────────────────────────────────────

function CardHorizontal({ course, progress }: { course: Course; progress: number }) {
    return (
        <Link
            to="/courses/$courseId"
            params={{ courseId: course.id }}
            className="group flex flex-row rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
        >
            {/* Left colour strip with icon */}
            <div className={`relative flex-shrink-0 w-40 bg-gradient-to-br ${course.color} flex flex-col items-center justify-center gap-2`}>
                <span className="text-5xl select-none">{course.icon}</span>
                <div className="absolute bottom-2 right-2">
                    <ProgressBadge progress={progress} />
                </div>
            </div>

            {/* Right content */}
            <div className="flex flex-col flex-1 p-5 gap-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                        {course.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${difficultyColor[course.difficulty]}`}>
                        {course.difficulty}
                    </span>
                </div>

                <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors leading-snug">
                    {course.title}
                </h3>

                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1">
                    {course.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <Clock size={12} /> {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                        <BarChart2 size={12} /> {course.modules.length} modules
                    </span>
                    <span className="flex items-center gap-1">
                        <Users size={12} /> {course.userCount} users
                    </span>
                    {progress > 0 && (
                        <span className="ml-auto text-purple-600 font-semibold">{progress}%</span>
                    )}
                </div>

                <ProgressBar progress={progress} />
            </div>
        </Link>
    )
}

// ─── 2-col: standard vertical card (original design) ─────────────────────────

function CardVertical({ course, progress }: { course: Course; progress: number }) {
    return (
        <Link
            to="/courses/$courseId"
            params={{ courseId: course.id }}
            className="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
        >
            {/* Banner */}
            <div className={`relative h-36 bg-gradient-to-br ${course.color} flex items-center justify-center`}>
                <span className="text-5xl select-none">{course.icon}</span>
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold ${difficultyColor[course.difficulty]}`}>
                    {course.difficulty}
                </span>
                <div className="absolute bottom-2 right-3">
                    <ProgressBadge progress={progress} />
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-4 gap-2">
                <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                    {course.category}
                </span>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors leading-snug">
                    {course.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1">
                    {course.description}
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} /> {course.duration}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                        <BarChart2 size={12} /> {course.modules.length} modules
                    </span>
                </div>
                <ProgressBar progress={progress} />
            </div>
        </Link>
    )
}

// ─── 3-col: compact card ──────────────────────────────────────────────────────

function CardCompact({ course, progress }: { course: Course; progress: number }) {
    return (
        <Link
            to="/courses/$courseId"
            params={{ courseId: course.id }}
            className="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
        >
            {/* Small banner */}
            <div className={`relative h-24 bg-gradient-to-br ${course.color} flex items-center justify-center`}>
                <span className="text-4xl select-none">{course.icon}</span>
                <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${difficultyColor[course.difficulty]}`}>
                    {course.difficulty}
                </span>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-3 gap-1.5">
                <span className="text-[10px] font-medium text-purple-600 uppercase tracking-wide">
                    {course.category}
                </span>
                <h3 className="text-xs font-semibold text-gray-900 group-hover:text-purple-700 transition-colors leading-snug line-clamp-2">
                    {course.title}
                </h3>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock size={10} /> {course.duration}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <BarChart2 size={10} /> {course.modules.length}
                    </span>
                    {progress > 0 && (
                        <span className="text-[10px] font-semibold text-purple-600">{progress}%</span>
                    )}
                </div>
                <ProgressBar progress={progress} />
            </div>
        </Link>
    )
}

// ─── main export ──────────────────────────────────────────────────────────────

export default function CourseCard({ course, cols }: CourseCardProps) {
    const progress = course.modules.length
        ? Math.round(course.modules.reduce((sum, m) => sum + m.completion, 0) / course.modules.length)
        : 0

    if (cols === 1) return <CardHorizontal course={course} progress={progress} />
    if (cols === 3) return <CardCompact course={course} progress={progress} />
    return <CardVertical course={course} progress={progress} />
}
