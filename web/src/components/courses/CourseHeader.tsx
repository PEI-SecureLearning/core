import { Clock, Users } from 'lucide-react'
import type { Course } from './courseData'

const difficultyBadge: Record<string, string> = {
    Beginner: 'bg-emerald-100 text-emerald-700',
    Intermediate: 'bg-purple-100 text-purple-700',
    Advanced: 'bg-red-100 text-red-700',
}

type CourseHeaderProps = {
    course: Course
    overallProgress: number
}

export default function CourseHeader({ course, overallProgress }: CourseHeaderProps) {
    return (
        <div className="relative h-[40%] z-10 rounded-b-lg border-l-4 border-purple-500 ring-1 ring-gray-200 bg-white shadow-md overflow-hidden">
            <div className="flex flex-col lg:flex-row">
                {/* Left content */}
                <div className="flex-1 p-6 lg:p-8 space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyBadge[course.difficulty]}`}>
                            {course.difficulty}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            {course.modules.length} Modules
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                        {course.title}
                    </h1>

                    {/* Description */}
                    <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                        {course.description}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-5 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                            <Clock size={15} className="text-purple-500" />
                            {course.duration}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Users size={15} className="text-purple-500" />
                            {course.userCount} Users
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">Course Progress</span>
                            <span className="text-xs font-bold text-purple-600">{overallProgress}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-700 ease-out"
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right illustration area */}
                <div className={`hidden lg:flex items-center justify-center w-56 bg-gradient-to-br ${course.color} bg-opacity-10`}>
                    <div className="w-36 h-36 rounded-2xl bg-purple-200/40 flex items-center justify-center">
                        <span className="text-6xl select-none">{course.icon}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
