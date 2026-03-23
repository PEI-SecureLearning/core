import { FileText, GripVertical, HelpCircle, Image } from 'lucide-react'
import type { Section } from '../types'
import { SectionRuleIcons } from './SectionRuleIcons'
import { THEMES, type AccentColor } from '../theme-context'

export function SectionDragPreview({ section, index, accentColor = 'primary' }: {
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
        <div className={`flex flex-col bg-surface rounded-2xl overflow-hidden shadow-2xl border-2 ${theme.dragBorder} w-[340px] rotate-1 opacity-95`}>
            <div className="flex items-center gap-2 px-4 py-3 bg-surface-subtle border-b border-border">
                <GripVertical className={`w-4 h-4 ${theme.dragGrip} flex-shrink-0`} />
                <span className="text-[10px] font-bold bg-muted-foreground/10 text-muted-foreground rounded px-1.5 py-0.5 flex-shrink-0 tabular-nums">
                    {index + 1}
                </span>
                <span className={`flex-1 text-sm font-semibold truncate ${section.title ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {section.title || 'Untitled section'}
                </span>
                {section.blocks.length > 0 && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {section.blocks.length} {section.blocks.length === 1 ? 'block' : 'blocks'}
                    </span>
                )}
                <SectionRuleIcons section={section} />
            </div>
            {section.blocks.length > 0 ? (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-surface">
                    {!!blockKindCounts['text'] && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                            {blockKindCounts['text']}
                        </span>
                    )}
                    {!!blockKindCounts['rich_content'] && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Image className="w-3.5 h-3.5 text-muted-foreground" />
                            {blockKindCounts['rich_content']}
                        </span>
                    )}
                    {!!blockKindCounts['question'] && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            {blockKindCounts['question']}
                        </span>
                    )}
                </div>
            ) : (
                <div className="px-4 py-2.5 text-xs text-muted-foreground italic">Empty section</div>
            )}
        </div>
    )
}
