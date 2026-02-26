import { Clock, FileText, Image as ImageIcon, X } from 'lucide-react'
import { useState } from 'react'
import type { RichContentBlock, RichMediaType } from './types'

const RICH_MEDIA_OPTIONS: { type: RichMediaType; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { type: 'image', label: 'Image', icon: <ImageIcon className="w-3.5 h-3.5" />, placeholder: 'https://…/image.png or backend asset URL'  },
    { type: 'video', label: 'Video', icon: <Clock     className="w-3.5 h-3.5" />, placeholder: 'https://…/video.mp4 or YouTube embed URL'   },
    { type: 'audio', label: 'Audio', icon: <Clock     className="w-3.5 h-3.5" />, placeholder: 'https://…/audio.mp3 or backend asset URL'   },
    { type: 'file',  label: 'File',  icon: <FileText  className="w-3.5 h-3.5" />, placeholder: 'https://…/document.pdf or backend asset URL'},
]

export function RichContentBlockEditor({ block, onUpdate, onRemove }: {
    readonly block: RichContentBlock
    readonly onUpdate: (patch: Partial<RichContentBlock>) => void
    readonly onRemove: () => void
}) {
    const meta = RICH_MEDIA_OPTIONS.find(o => o.type === block.mediaType) ?? RICH_MEDIA_OPTIONS[0]
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div 
            className="flex flex-col border border-violet-200 rounded-xl overflow-hidden bg-white"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 border-b border-violet-100">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-1 bg-violet-100 text-violet-600">
                    Media
                </span>
                {/* Media type tabs */}
                <div className={`flex gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    {RICH_MEDIA_OPTIONS.map(o => (
                        <button
                            key={o.type}
                            type="button"
                            onClick={() => onUpdate({ mediaType: o.type })}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                                block.mediaType === o.type
                                    ? 'bg-violet-600 text-white border-violet-600'
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                            }`}
                        >
                            {o.icon}
                            {o.label}
                        </button>
                    ))}
                </div>
                <button type="button" onClick={onRemove}
                    className="ml-auto text-slate-300 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex flex-col gap-2.5 px-4 py-3">
                {/* URL input */}
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        {meta.label} URL
                    </label>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-violet-300/50 focus-within:border-violet-300">
                        <span className="text-slate-400 flex-shrink-0">{meta.icon}</span>
                        <input
                            type="url"
                            value={block.url}
                            onChange={e => onUpdate({ url: e.target.value })}
                            placeholder={meta.placeholder}
                            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none min-w-0"
                        />
                        {block.url && (
                            <button type="button" onClick={() => onUpdate({ url: '' })}
                                className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Caption */}
                <input
                    type="text"
                    value={block.caption}
                    onChange={e => onUpdate({ caption: e.target.value })}
                    placeholder="Caption (optional)…"
                    className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300/50 text-slate-700 placeholder:text-slate-400"
                />

                {/* Inline preview */}
                {block.url && (
                    <div className="rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                        {block.mediaType === 'image' && (
                            <img src={block.url} alt={block.caption || 'preview'}
                                className="max-h-48 w-full object-contain" />
                        )}
                        {block.mediaType === 'video' && (
                            <video src={block.url} controls className="w-full max-h-48">
                                <track kind="captions" />
                            </video>
                        )}
                        {block.mediaType === 'audio' && (
                            <audio src={block.url} controls className="w-full px-3 py-2">
                                <track kind="captions" />
                            </audio>
                        )}
                        {block.mediaType === 'file' && (
                            <a href={block.url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-3 text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors">
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{block.url}</span>
                            </a>
                        )}
                        {block.caption && (
                            <p className="text-[11px] text-slate-500 text-center px-3 py-1.5 border-t border-slate-100 italic">
                                {block.caption}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
