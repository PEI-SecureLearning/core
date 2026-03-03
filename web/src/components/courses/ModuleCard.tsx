import { BookOpen, Clock, CheckCircle2, Clock3, Circle } from 'lucide-react'
import type { CourseModule } from './courseData'

// ─── status helpers ──────────────────────────────────────────────────────────

const moduleDifficultyBadge: Record<string, string> = {
    Easy: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-amber-100 text-amber-700',
    Hard: 'bg-red-100 text-red-700',
}

type StatusMeta = {
    label: string
    labelColor: string
    iconBg: string
    icon: React.ReactNode
    barColor: string
}

function statusMeta(mod: CourseModule): StatusMeta {
    if (mod.status === 'completed') {
        return {
            label: 'Completed',
            labelColor: 'text-emerald-600',
            iconBg: 'bg-emerald-500',
            icon: <CheckCircle2 size={22} className="text-white" />,
            barColor: 'bg-emerald-500',
        }
    }
    if (mod.status === 'in-progress') {
        return {
            label: 'In progress',
            labelColor: 'text-amber-600',
            iconBg: 'bg-amber-400',
            icon: <Clock3 size={22} className="text-white" />,
            barColor: 'bg-purple-500',
        }
    }
    return {
        label: 'Not started',
        labelColor: 'text-gray-400',
        iconBg: 'bg-gray-200',
        icon: <Circle size={22} className="text-gray-400" />,
        barColor: 'bg-gray-200',
    }
}

// ─── component ───────────────────────────────────────────────────────────────

type ModuleCardProps = {
    module: CourseModule
}

export default function ModuleCard({ module: mod }: ModuleCardProps) {
    const meta = statusMeta(mod)

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
            {/* Status icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${meta.iconBg} flex items-center justify-center mt-0.5`}>
                {meta.icon}
            </div>

            {/* Module content */}
            <div className="flex-1 min-w-0 space-y-2">
                {/* Status + difficulty */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${meta.labelColor}`}>
                        {meta.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${moduleDifficultyBadge[mod.difficulty]}`}>
                        {mod.difficulty}
                    </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed">
                    {mod.description}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {mod.lessons} Lessons
                    </span>
                    <span className="flex items-center gap-1">
                        🧪 {mod.labs} Labs
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {mod.hours}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${meta.barColor} transition-all duration-500`}
                        style={{ width: `${mod.completion}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
