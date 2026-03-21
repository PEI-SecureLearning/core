/**
 * ContentFilePicker
 *
 * A modal with two tabs:
 *  • Library  – browse the content file-tree and select an existing file
 *  • Upload   – drag-drop / click to upload a new file to the library,
 *               then immediately use it
 *
 * Usage:
 *   <ContentFilePicker
 *     token={keycloak.token}
 *     accept="image"          // 'image' | 'video' | 'audio' | 'file' | undefined (all)
 *     onSelect={(url, item) => …}
 *     onClose={() => …}
 *   />
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
    CheckCircle2, ChevronRight, FileText, Folder, FolderOpen,
    Image as ImageIcon, Loader2, Music, Search, Upload, Video, X,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL as string

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContentFileItem {
    id: string
    content_piece_id: string
    path: string
    title: string
    description: string | null
    content_format: string
    created_at: string
    file: {
        filename: string
        content_type: string
        size: number
        storage?: 'garage' | null
        object_key?: string | null
        etag?: string | null
        file_url?: string | null
    } | null
}

/** Mirrors RichMediaType from module-creation/types.ts */
export type PickerMediaFilter = 'image' | 'video' | 'audio' | 'file' | 'any'

interface ContentFilePickerProps {
    readonly token?: string
    readonly accept?: PickerMediaFilter   // default: 'any'
    readonly onSelect: (url: string, item: ContentFileItem) => void
    readonly onClose: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const compareAlpha = (a: string, b: string) =>
    a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })

function mimeMatchesFilter(contentType: string, filter: PickerMediaFilter): boolean {
    if (filter === 'any') return true
    if (filter === 'image') return contentType.startsWith('image/')
    if (filter === 'video') return contentType.startsWith('video/')
    if (filter === 'audio') return contentType.startsWith('audio/')
    // 'file' = everything else (pdf, docs, etc.)
    return (
        !contentType.startsWith('image/') &&
        !contentType.startsWith('video/') &&
        !contentType.startsWith('audio/')
    )
}

function fileIcon(contentType: string) {
    if (contentType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-accent-secondary flex-shrink-0" />
    if (contentType.startsWith('video/')) return <Video className="w-4 h-4 text-blue-400   flex-shrink-0" />
    if (contentType.startsWith('audio/')) return <Music className="w-4 h-4 text-green-400  flex-shrink-0" />
    return <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
}

function humanSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Build a URL we can hand to <img> / <video> / etc. */
function resolveUrl(item: ContentFileItem): string {
    if (item.file?.file_url) return item.file.file_url
    return ''
}

function resolvePreviewUrl(item: ContentFileItem): string | null {
    if (item.file?.file_url) return item.file.file_url
    return null
}

// ── Component ─────────────────────────────────────────────────────────────────

type Tab = 'library' | 'upload'

export function ContentFilePicker({ token, accept = 'any', onSelect, onClose }: ContentFilePickerProps) {
    const [tab, setTab] = useState<Tab>('library')

    // ── Library state ────────────────────────────────────────────────────────
    const [items, setItems] = useState<ContentFileItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [selectedDir, setSelectedDir] = useState('content')
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['content']))
    const [selecting, setSelecting] = useState<string | null>(null)

    // ── Upload state ─────────────────────────────────────────────────────────
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadPath, setUploadPath] = useState('content')
    const [uploadTitle, setUploadTitle] = useState('')
    const [uploadDesc, setUploadDesc] = useState('')
    const [uploadTags, setUploadTags] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploadDone, setUploadDone] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ── Fetch all content items ──────────────────────────────────────────────

    const fetchItems = useCallback(() => {
        let cancelled = false
        setLoading(true)
        setError(null)
        fetch(`${API_BASE}/content`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json() as Promise<ContentFileItem[]>
            })
            .then(data => { if (!cancelled) setItems(data) })
            .catch(e => { if (!cancelled) setError((e as Error).message) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [token])

    useEffect(fetchItems, [fetchItems])

    // ── Filter + search ──────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        let list = items
        if (accept !== 'any')
            list = list.filter(i => i.file && mimeMatchesFilter(i.file.content_type, accept))
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(i =>
                i.title.toLowerCase().includes(q) || i.path.toLowerCase().includes(q)
            )
        }
        return list
    }, [items, accept, search])

    // ── Directory tree ───────────────────────────────────────────────────────

    const dirPaths = useMemo(() => {
        const dirs = new Set<string>(['content'])
        for (const item of filtered) {
            const parts = item.path.replace(/^\/+/, '').split('/').filter(Boolean)
            let cur = ''
            for (const p of parts) { cur = cur ? `${cur}/${p}` : p; dirs.add(cur) }
        }
        return Array.from(dirs).sort(compareAlpha)
    }, [filtered])

    const dirChildren = useMemo(() => {
        const map = new Map<string, string[]>()
        for (const dir of dirPaths) {
            const parts = dir.split('/')
            const parent = parts.length > 1 ? parts.slice(0, -1).join('/') : ''
            if (!map.has(parent)) map.set(parent, [])
            const bucket = map.get(parent)
            if (bucket) bucket.push(dir)
        }
        for (const [k, v] of map) {
            const sorted = [...v].sort(compareAlpha)
            map.set(k, sorted)
        }
        return map
    }, [dirPaths])

    const visibleItems = useMemo(
        () => filtered.filter(i => i.path === selectedDir || i.path.startsWith(`${selectedDir}/`)),
        [filtered, selectedDir]
    )

    const toggleDir = (dir: string) =>
        setExpandedDirs(prev => {
            const next = new Set(prev)
            next.has(dir) ? next.delete(dir) : next.add(dir)
            return next
        })

    const renderTree = (parent: string, level = 0): ReactNode[] =>
        (dirChildren.get(parent) ?? []).map(dir => {
            const isExpanded = expandedDirs.has(dir)
            const isSelected = selectedDir === dir
            const label = dir.split('/').pop() ?? dir
            const hasChildren = (dirChildren.get(dir) ?? []).length > 0
            return (
                <div key={dir}>
                    <button
                        type="button"
                        onClick={() => setSelectedDir(dir)}
                        style={{ paddingLeft: `${8 + level * 14}px` }}
                        className={`w-full flex items-center gap-2 py-1.5 pr-2 rounded text-left text-sm transition-colors ${isSelected ? 'bg-primary/15 text-accent-secondary font-medium' : 'text-foreground hover:bg-surface'
                            }`}
                    >
                        {hasChildren ? (
                            <ChevronRight
                                className={`w-3 h-3 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                                onClick={e => { e.stopPropagation(); toggleDir(dir) }}
                            />
                        ) : (
                            <span className="w-3 flex-shrink-0" />
                        )}
                        {isExpanded
                            ? <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            : <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        }
                        <span className="truncate">{label}</span>
                    </button>
                    {isExpanded && hasChildren && renderTree(dir, level + 1)}
                </div>
            )
        })

    // ── Select a file ────────────────────────────────────────────────────────

    const handleSelect = async (item: ContentFileItem) => {
        if (item.file?.file_url) {
            onSelect(resolveUrl(item), item)
            return
        }
        setSelecting(item.content_piece_id)
        try {
            const res = await fetch(
                `${API_BASE}/content/${encodeURIComponent(item.content_piece_id)}/file-url`,
                { headers: { Authorization: token ? `Bearer ${token}` : '' } }
            )
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const payload = await res.json() as { url: string | null }
            if (!payload.url) throw new Error('Missing file URL')
            onSelect(payload.url, item)
        } catch {
            onSelect('', item)
        } finally {
            setSelecting(null)
        }
    }

    // ── Upload a file ────────────────────────────────────────────────────────

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!uploadFile) return
        setUploading(true)
        setUploadError(null)
        try {
            const fd = new FormData()
            fd.append('file', uploadFile)
            fd.append('path', uploadPath.trim() || 'content')
            fd.append('title', uploadTitle.trim() || uploadFile.name)
            if (uploadDesc.trim()) fd.append('description', uploadDesc.trim())
            if (uploadTags.trim()) fd.append('tags', uploadTags.trim())

            const res = await fetch(`${API_BASE}/content/upload`, {
                method: 'POST',
                headers: { Authorization: token ? `Bearer ${token}` : '' },
                body: fd,
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const created = await res.json() as ContentFileItem

            // Refresh library list, then switch to library + auto-select
            setUploadDone(true)
            setItems(prev => [...prev, created])
            setSelectedDir(created.path)
            setExpandedDirs(prev => {
                const next = new Set(prev)
                const parts = created.path.split('/')
                let cur = ''
                for (const p of parts) {
                    cur = cur ? `${cur}/${p}` : p
                    next.add(cur)
                }
                return next
            })
            setTab('library')
            // Auto-select the newly uploaded file after a brief moment
            setTimeout(() => { void handleSelect(created) }, 100)
        } catch (err) {
            setUploadError((err as Error).message)
        } finally {
            setUploading(false)
        }
    }

    const onDropFile = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files[0]
        if (f) {
            setUploadFile(f)
            if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^.]+$/, ''))
        }
    }

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (f) {
            setUploadFile(f)
            if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^.]+$/, ''))
        }
    }

    const acceptAttr = (() => {
        if (accept === 'image') return 'image/*'
        if (accept === 'video') return 'video/*'
        if (accept === 'audio') return 'audio/*'
        return undefined
    })()

    // ── Labels ───────────────────────────────────────────────────────────────

    const acceptLabel: Record<PickerMediaFilter, string> = {
        image: 'Images', video: 'Videos', audio: 'Audio', file: 'Files', any: 'All files',
    }

    // ── Library body ─────────────────────────────────────────────────────────

    function renderLibrary() {
        if (loading) return (
            <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading files…</span>
            </div>
        )
        if (error) return (
            <div className="flex-1 flex items-center justify-center text-red-500 text-sm">{error}</div>
        )
        return (
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Sidebar tree */}
                <aside className="w-52 flex-shrink-0 border-r border-border p-3 overflow-y-auto bg-surface-subtle/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                        Directories
                    </p>
                    <div className="space-y-0.5">{renderTree('')}</div>
                </aside>

                {/* File list */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-4 py-2.5 border-b border-border text-xs text-muted-foreground bg-surface sticky top-0">
                        <span className="font-semibold text-foreground">{selectedDir}</span>
                        <span> · {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'}</span>
                    </div>

                    {visibleItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground/50">
                            <Folder className="w-8 h-8" />
                            <p className="text-sm">No {acceptLabel[accept].toLowerCase()} here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {visibleItems.map(item => {
                                const isSelecting = selecting === item.content_piece_id
                                const previewUrl = resolvePreviewUrl(item)
                                return (
                                    <div key={item.id}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors">
                                        {item.file ? fileIcon(item.file.content_type) : <FileText className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />}

                                        {item.file?.content_type.startsWith('image/') && previewUrl && (
                                            <img
                                                src={previewUrl}
                                                alt=""
                                                className="w-10 h-10 rounded object-cover border border-border flex-shrink-0"
                                            />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{item.path}</p>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {item.file && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {humanSize(item.file.size)}
                                                </span>
                                            )}
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-muted-foreground uppercase font-medium">
                                                {item.content_format}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={isSelecting}
                                                onClick={() => void handleSelect(item)}
                                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                {isSelecting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Use'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ── Upload body ───────────────────────────────────────────────────────────

    function renderUpload() {
        if (uploadDone) return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-8">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
                <p className="text-sm font-medium text-foreground">Uploaded! Switching to library…</p>
            </div>
        )

        return (
            <form onSubmit={e => void handleUpload(e)} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

                {/* Drop zone */}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDropFile}
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors py-10 ${dragOver
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border hover:border-primary/40 hover:bg-primary/5'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        id="cfp-file-input"
                        type="file"
                        className="sr-only"
                        onChange={onPickFile}
                        accept={acceptAttr}
                    />
                    {uploadFile ? (
                        <>
                            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                                {fileIcon(uploadFile.type)}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">{uploadFile.name}</p>
                                <p className="text-xs text-muted-foreground">{humanSize(uploadFile.size)} · click to change</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <Upload className="w-8 h-8 text-muted-foreground/50" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-muted-foreground">Drag & drop or click to browse</p>
                                <p className="text-xs text-muted-foreground">{acceptLabel[accept]}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Metadata fields */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="cfp-title" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Title</label>
                        <input
                            id="cfp-title"
                            type="text"
                            value={uploadTitle}
                            onChange={e => setUploadTitle(e.target.value)}
                            placeholder="My file"
                            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="cfp-path" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Directory path</label>
                        <input
                            id="cfp-path"
                            type="text"
                            value={uploadPath}
                            onChange={e => setUploadPath(e.target.value)}
                            placeholder="content/images"
                            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 font-mono"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="cfp-desc" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Description <span className="normal-case font-normal text-muted-foreground">(optional)</span></label>
                        <input
                            id="cfp-desc"
                            type="text"
                            value={uploadDesc}
                            onChange={e => setUploadDesc(e.target.value)}
                            placeholder="Short description…"
                            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="cfp-tags" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Tags <span className="normal-case font-normal text-muted-foreground">(comma-separated)</span></label>
                        <input
                            id="cfp-tags"
                            type="text"
                            value={uploadTags}
                            onChange={e => setUploadTags(e.target.value)}
                            placeholder="tag1, tag2"
                            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                        />
                    </div>
                </div>

                {uploadError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        Upload failed: {uploadError}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={!uploadFile || uploading}
                    className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-primary/25"
                >
                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload & Use</>}
                </button>
            </form>
        )
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
                onClick={onClose}
                aria-label="Close"
            />

            {/* Panel */}
            <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-4xl mx-4 h-[82vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-border flex-shrink-0">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setTab('library')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'library'
                                ? 'bg-surface text-accent-secondary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Library
                        </button>
                        <button
                            type="button"
                            onClick={() => { setTab('upload'); setUploadDone(false) }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'upload'
                                ? 'bg-surface text-accent-secondary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Upload
                        </button>
                    </div>

                    {/* Search (library only) + close */}
                    <div className="flex items-center gap-3">
                        {tab === 'library' && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={`Search ${acceptLabel[accept].toLowerCase()}…`}
                                    className="pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
                                />
                            </div>
                        )}
                        <button type="button" onClick={onClose}
                            className="text-muted-foreground hover:text-muted-foreground transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                {tab === 'library' ? renderLibrary() : renderUpload()}
            </div>
        </div>
    )
}
