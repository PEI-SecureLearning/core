import { FileText, GripVertical, HelpCircle, Image } from 'lucide-react'
import type { Section } from '../types'
import { SectionRuleIcons } from './SectionRuleIcons'
import { THEMES, type AccentColor } from './themes'

export function SectionDragPreview({ section, index, accentColor = 'purple' }: {
    readonly section: Section
    readonly index: number
    readonly accentColor?: AccentColor
}) {
    const theme = THEMES[accentColor]
    const blockKindCounts = section.blocks.reduce(
        (acc, b) => { acc[b.kind] = (acc[b.kind] ?? 0) + 1; return acc },
        {} as Record<string, number>
    )

    return (
        <div className={`flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl border-2 ${theme.dragBorder} w-[340px] rotate-1 opacity-95`}>
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <GripVertical className={`w-4 h-4 ${theme.dragGrip} flex-shrink-0`} />
                <span className={`text-[11px] font-bold rounded px-1.5 py-0.5 flex-shrink-0 tabular-nums ${theme.dragBadge}`}>
                    {index + 1}
                </span>
                <span className={`flex-1 text-sm font-semibold truncate ${section.title ? 'text-slate-800' : 'text-slate-400'}`}>
                    {section.title || 'Untitled section'}
                </span>
                {section.blocks.length > 0 && (
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {section.blocks.length} {section.blocks.length === 1 ? 'block' : 'blocks'}
                    </span>
                )}
                <SectionRuleIcons section={section} />
            </div>
            {section.blocks.length > 0 ? (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white">
                    {!!blockKindCounts['text'] && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            {blockKindCounts['text']}
                        </span>
                    )}
                    {!!blockKindCounts['rich_content'] && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Image className="w-3.5 h-3.5 text-slate-400" />
                            {blockKindCounts['rich_content']}
                        </span>
                    )}
                    {!!blockKindCounts['question'] && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                            {blockKindCounts['question']}
                        </span>
                    )}
                </div>
            ) : (
                <div className="px-4 py-2.5 text-xs text-slate-400 italic">Empty section</div>
            )}
        </div>
    )
}
