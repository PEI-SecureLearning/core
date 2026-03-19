import { AlertCircle, Pencil } from 'lucide-react'
import type { Section } from '../types'
import { useModuleTheme } from '../theme-context'

export function SectionTitleEditor({ section, onUpdate, onStopEdit, titleMissing, editing, inputRef, sizerRef, syncWidth, onStartEdit }: {
    readonly section: Section
    readonly onUpdate: (patch: Partial<Section>) => void
    readonly onStopEdit: () => void
    readonly titleMissing: boolean
    readonly editing: boolean
    readonly inputRef: React.RefObject<HTMLInputElement | null>
    readonly sizerRef: React.RefObject<HTMLSpanElement | null>
    readonly syncWidth: () => void
    readonly onStartEdit: () => void
}) {
    const { theme } = useModuleTheme()
    if (editing) {
        return (
            <span className="relative z-10 inline-flex items-center min-w-0 shrink-0 max-w-[40%]">
                <span
                    ref={sizerRef}
                    aria-hidden
                    className="absolute invisible whitespace-pre text-sm font-semibold px-2 py-0.5 pointer-events-none"
                    style={{ minWidth: '10ch' }}
                />
                <input
                    ref={inputRef}
                    value={section.title}
                    onChange={e => { onUpdate({ title: e.target.value }); syncWidth() }}
                    onBlur={onStopEdit}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { e.currentTarget.blur() } }}
                    onClick={e => e.stopPropagation()}
                    onDoubleClick={e => e.stopPropagation()}
                    placeholder="Section title..."
                    style={{ minWidth: '10ch' }}
                    className={`text-sm font-semibold text-foreground bg-surface rounded-md px-2 py-0.5 focus:outline-none w-full ${titleMissing
                        ? 'border border-amber-400 focus:ring-amber-300/40'
                        : `border ${theme.inputBorder} ${theme.inputRing}`
                        }`}
                />
                <Pencil className={`w-3 h-3 ml-2 text-muted-foreground/50 ${theme.pencil} transition-colors flex-shrink-0`} />
            </span>
        )
    }

    return (
        <button
            type="button"
            onClick={e => { e.stopPropagation(); onStartEdit() }}
            onDoubleClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 min-w-0 group text-left relative z-10 shrink-0 max-w-[40%]"
            title={titleMissing ? 'Title is required — click to add' : 'Click to edit title'}
        >
            {(() => {
                let textCls = 'text-muted-foreground'
                if (titleMissing) textCls = 'text-amber-500'
                else if (section.title) textCls = 'text-foreground'
                return (
                    <span className={`text-sm font-semibold truncate ${textCls}`}>
                        {section.title || (titleMissing ? 'Title required' : 'Untitled section')}
                    </span>
                )
            })()}
            {titleMissing
                ? <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                : <Pencil className={`w-3 h-3 text-muted-foreground/50 ${theme.pencil} transition-colors flex-shrink-0`} />
            }
        </button>
    )
}
