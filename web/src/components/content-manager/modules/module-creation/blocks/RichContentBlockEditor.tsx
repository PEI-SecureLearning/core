import { useState, useEffect } from 'react'
import { Clock, FileText, Image as ImageIcon, X } from 'lucide-react'
import type { RichContentBlock, RichMediaType } from '../types'
import { AutoResizeTextarea } from './AutoResizeTextarea'
import { ContentFilePicker, type PickerMediaFilter } from '../ContentFilePicker'

const API_BASE = import.meta.env.VITE_API_URL as string

const RICH_MEDIA_OPTIONS: { type: RichMediaType; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { type: 'image', label: 'Image', icon: <ImageIcon className="w-3.5 h-3.5" />, placeholder: 'https://…/image.png or backend asset URL'   },
    { type: 'video', label: 'Video', icon: <Clock     className="w-3.5 h-3.5" />, placeholder: 'https://…/video.mp4 or YouTube embed URL'    },
    { type: 'audio', label: 'Audio', icon: <Clock     className="w-3.5 h-3.5" />, placeholder: 'https://…/audio.mp3 or backend asset URL'    },
    { type: 'file',  label: 'File',  icon: <FileText  className="w-3.5 h-3.5" />, placeholder: 'https://…/document.pdf or backend asset URL' },
]

export function RichContentBlockEditor({ block, onUpdate, onRemove, getToken }: {
    readonly block: RichContentBlock
    readonly onUpdate: (patch: Partial<RichContentBlock>) => void
    readonly onRemove: () => void
    readonly getToken?: () => string | undefined
}) {
    const [pickerOpen, setPickerOpen] = useState(false)
    const meta = RICH_MEDIA_OPTIONS.find(o => o.type === block.mediaType) ?? RICH_MEDIA_OPTIONS[0]

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
        <div className="flex flex-col border border-violet-200 rounded-xl overflow-hidden bg-surface group">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 border-b border-violet-100">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-1 bg-violet-100 text-violet-600">
                    Media
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    {RICH_MEDIA_OPTIONS.map(o => (
                        <button
                            key={o.type}
                            type="button"
                            onClick={() => onUpdate({ mediaType: o.type })}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                                block.mediaType === o.type
                                    ? 'bg-violet-600 text-white border-violet-600'
                                    : 'bg-surface text-muted-foreground border-border hover:border-violet-300 hover:text-violet-600'
                            }`}
                        >
                            {o.icon}
                            {o.label}
                        </button>
                    ))}
                </div>
                <button type="button" onClick={onRemove}
                    className="ml-auto text-muted-foreground/50 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
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
                                <div className="flex items-center gap-2 px-4 py-3 text-sm text-violet-600 font-medium">
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
                            className="flex items-center justify-center w-full border-2 border-dashed border-violet-200 rounded-lg px-3 py-3 text-[12px] font-medium text-violet-500 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50/50 transition-all"
                        >
                            Choose from content library…
                        </button>
                    )}
                </div>

                <AutoResizeTextarea
                    value={block.caption}
                    onChange={e => onUpdate({ caption: e.target.value })}
                    placeholder="Caption (optional)…"
                    className="text-sm bg-surface-subtle border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300/50 text-foreground placeholder:text-muted-foreground"
                />
            </div>
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
