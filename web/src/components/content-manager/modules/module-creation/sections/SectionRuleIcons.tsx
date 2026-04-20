import { CheckCircle, Clock, SkipForward } from 'lucide-react'
import type { Section } from '../types'

export function SectionRuleIcons({ section, withTooltips }: {
    readonly section: Section
    readonly withTooltips?: boolean
}) {
    if (!section.requireCorrectAnswers && !section.isOptional && !section.minTimeSpent) return null

    if (!withTooltips) {
        return (
            <div className="flex items-center gap-1 flex-shrink-0">
                {section.requireCorrectAnswers && <CheckCircle className="w-3.5 h-3.5 text-success" />}
                {section.isOptional           && <SkipForward  className="w-3.5 h-3.5 text-info"  />}
                {!!section.minTimeSpent       && <Clock        className="w-3.5 h-3.5 text-warning"/>}
            </div>
        )
    }

    return (
        <div className="flex items-center gap-1 flex-shrink-0 relative z-10">
            {section.requireCorrectAnswers && (
                <div className="group relative">
                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0C0A0F] text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Correct answers required
                    </span>
                </div>
            )}
            {section.isOptional && (
                <div className="group relative">
                    <SkipForward className="w-3.5 h-3.5 text-info" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0C0A0F] text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Optional section
                    </span>
                </div>
            )}
            {!!section.minTimeSpent && section.minTimeSpent > 0 && (
                <div className="group relative">
                    <Clock className="w-3.5 h-3.5 text-warning" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0C0A0F] text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Min. {section.minTimeSpent}s required
                    </span>
                </div>
            )}
        </div>
    )
}
