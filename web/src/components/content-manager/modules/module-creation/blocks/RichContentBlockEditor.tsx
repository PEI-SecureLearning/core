import { useState, useEffect } from 'react'
import { Clock, FileText, Image as ImageIcon, X } from 'lucide-react'
import type { RichContentBlock, RichMediaType } from '../types'
import { AutoResizeTextarea } from './AutoResizeTextarea'
import { BlockWarning } from './BlockWarning'
import { ContentFilePicker, type PickerMediaFilter } from '../ContentFilePicker'

const API_BASE = import.meta.env.VITE_API_URL as string

const RICH_MEDIA_OPTIONS: { type: RichMediaType; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { type: 'image', label: 'Image', icon: <ImageIcon className="w-3.5 h-3.5" />, placeholder: 'https://…/image.png or backend asset URL' },
    { type: 'video', label: 'Video', icon: <Clock className="w-3.5 h-3.5" />, placeholder: 'https://…/video.mp4 or YouTube embed URL' },
    { type: 'audio', label: 'Audio', icon: <Clock className="w-3.5 h-3.5" />, placeholder: 'https://…/audio.mp3 or backend asset URL' },
    { type: 'file', label: 'File', icon: <FileText className="w-3.5 h-3.5" />, placeholder: 'https://…/document.pdf or backend asset URL' },
]

export function RichContentBlockEditor({ block, onUpdate, onRemove, getToken, publishAttempted }: {
    readonly block: RichContentBlock
    readonly onUpdate: (patch: Partial<RichContentBlock>) => void
    readonly onRemove: () => void
    readonly getToken?: () => string | undefined
    readonly publishAttempted?: boolean
}) {
    const [pickerOpen, setPickerOpen] = useState(false)
    const meta = RICH_MEDIA_OPTIONS.find(o => o.type === block.mediaType) ?? RICH_MEDIA_OPTIONS[0]
    const showWarning = publishAttempted === true && !block.contentId

    // When block is loaded from backend, contentId is set but url is empty.
    // Fetch the file and populate url so the preview renders.
    useEffect(() => {
        if (!block.contentId || block.url) return
        const token = getToken?.()
        let revoked = false
        fetch(`${API_BASE}/content/${encodeURIComponent(block.contentId)}/file-url`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(r => r.ok ? r.json() as Promise<{ url: string | null }> : Promise.reject(new Error('not ok')))
            .then(payload => {
                if (!revoked && payload.url) {
                    onUpdate({ url: payload.url })
                }
            })
            .catch(() => { /* preview stays empty */ })
        return () => { revoked = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [block.contentId])

    return (
        <>
            <div className={`flex flex-col border rounded-xl overflow-hidden bg-surface group transition-colors ${showWarning ? 'border-amber-400' : 'border-border'
                }`}>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-subtle border-b border-border">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-1 bg-muted-foreground/10 text-muted-foreground">
                        Media
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        {RICH_MEDIA_OPTIONS.map(o => (
                            <button
                                key={o.type}
                                type="button"
                                onClick={() => onUpdate({ mediaType: o.type })}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${block.mediaType === o.type
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted-foreground/5 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground'
                                    }`}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={onRemove}
                        title="Remove block"
                        className="ml-auto p-1 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-md transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex flex-col gap-2.5 px-4 py-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {meta.label} source
                        </label>

                        {block.contentId ? (
                            /* ── Platform file chosen — show media preview with overlay controls ── */
                            <div className="relative rounded-lg overflow-hidden border border-violet-200 bg-surface-subtle group/preview">
                                {/* Media preview */}
                                {block.mediaType === 'image' && block.url && (
                                    <img src={block.url} alt={block.caption || 'preview'}
                                        className="max-h-48 w-full object-contain" />
                                )}
                                {block.mediaType === 'image' && !block.url && (
                                    <div className="flex items-center justify-center h-24 text-muted-foreground/50 gap-2 text-xs italic">
                                        <ImageIcon className="w-4 h-4" /> Loading…
                                    </div>
                                )}
                                {block.mediaType === 'video' && block.url && (
                                    <video src={block.url} controls className="w-full max-h-48">
                                        <track kind="captions" />
                                    </video>
                                )}
                                {block.mediaType === 'audio' && block.url && (
                                    <audio src={block.url} controls className="w-full px-3 py-2">
                                        <track kind="captions" />
                                    </audio>
                                )}
                                {block.mediaType === 'file' && (
                                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-primary font-medium">
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate font-mono text-xs">{block.contentId}</span>
                                    </div>
                                )}
                                {/* Remove button — top-right overlay */}
                                <button
                                    type="button"
                                    onClick={() => onUpdate({ url: '', contentId: '' })}
                                    title="Remove file"
                                    className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            /* ── No file yet — dashed button, no icon ── */
                            <button
                                type="button"
                                onClick={() => setPickerOpen(true)}
                                className="flex items-center justify-center w-full border border-dashed border-border rounded-lg px-3 py-3 text-[12px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-surface-subtle transition-all"
                            >
                                Choose from content library…
                            </button>
                        )}
                    </div>

                    <AutoResizeTextarea
                        value={block.caption}
                        onChange={e => onUpdate({ caption: e.target.value })}
                        placeholder="Caption (optional)…"
                        className="text-sm bg-surface-subtle border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                {showWarning && <BlockWarning message={`Please select and upload ${block.mediaType} content.`} />}
            </div>
            {pickerOpen && (
                <ContentFilePicker
                    token={getToken?.()}
                    accept={block.mediaType as PickerMediaFilter}
                    onSelect={(url, item) => {
                        onUpdate({ url, contentId: item.content_piece_id })
                        setPickerOpen(false)
                    }}
                    onClose={() => setPickerOpen(false)}
                />
            )}
        </>
    )
}
