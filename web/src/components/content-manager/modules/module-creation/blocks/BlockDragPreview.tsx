import { GripVertical } from 'lucide-react'
import type { Block } from '../types'

const KIND_META = {
    text:         { label: 'Text',     color: 'bg-blue-50 text-blue-500 border-blue-200'        },
    rich_content: { label: 'Media',    color: 'bg-violet-50 text-violet-500 border-violet-200'  },
    question:     { label: 'Question', color: 'bg-[#7C3AED]/10 text-[#A78BFA] border-[#7C3AED]/30'  },
} as const

export function BlockDragPreview({ block }: { readonly block: Block }) {
    const meta = KIND_META[block.kind]

    let preview: string
    if (block.kind === 'text')              preview = block.content.trim().slice(0, 120) || 'Empty text block'
    else if (block.kind === 'rich_content') preview = block.url || `${block.mediaType} block`
    else                                    preview = block.question.text.trim().slice(0, 120) || 'Empty question'

    return (
        <div className="flex gap-2 w-[380px] pointer-events-none rotate-1 opacity-95">
            <GripVertical className="w-4 h-4 text-[#A78BFA] flex-shrink-0 mt-2.5" />
            <div className="flex-1 min-w-0 border-2 border-[#7C3AED]/60 rounded-xl overflow-hidden bg-surface shadow-2xl">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-subtle border-b border-border">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${meta.color}`}>
                        {meta.label}
                    </span>
                </div>
                <p className={`px-4 py-3 text-sm truncate ${preview.startsWith('Empty') ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                    {preview}
                </p>
            </div>
        </div>
    )
}
