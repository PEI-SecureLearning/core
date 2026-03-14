import { useEffect, useMemo, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL;

type ContentDetail = {
    content_piece_id: string;
    folder_id?: string | null;
    path: string;
    title: string;
    description: string | null;
    kind: string;
    content_format: string;
    body: string | null;
    source_url: string | null;
    tags: string[];
    file: {
        filename: string;
        content_type: string;
        size: number;
        storage?: 'garage' | null;
        object_key?: string | null;
        etag?: string | null;
        file_url?: string | null;
    } | null;
    created_at: string;
    updated_at: string;
};

type ContentFolder = {
    folder_id: string;
    path: string;
};

interface ViewContentModalProps {
    contentPieceId: string | null;
    startInEditMode?: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

export function ViewContentModal({ contentPieceId, startInEditMode = false, onClose, onUpdated }: ViewContentModalProps) {
    const { keycloak } = useKeycloak();
    const [content, setContent] = useState<ContentDetail | null>(null);
    const [folders, setFolders] = useState<ContentFolder[]>([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [folderId, setFolderId] = useState('fld_root');
    const [body, setBody] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const open = !!contentPieceId;

    const sortedFolders = useMemo(
        () => [...folders].sort((left, right) => left.path.localeCompare(right.path, undefined, { sensitivity: 'base', numeric: true })),
        [folders]
    );

    // Fetch content details when contentPieceId changes
    useEffect(() => {
        if (!contentPieceId) {
            setContent(null);
            setIsEditing(false);
            return;
        }

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const headers = {
                    Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
                };
                const [contentRes, foldersRes] = await Promise.all([
                    fetch(`${API_BASE}/content/${encodeURIComponent(contentPieceId)}`, { headers }),
                    fetch(`${API_BASE}/content/folders`, { headers }),
                ]);
                if (!contentRes.ok || !foldersRes.ok) throw new Error('Failed to load details');
                const data = await contentRes.json() as ContentDetail;
                const folderData = await foldersRes.json() as ContentFolder[];
                setContent(data);
                setFolders(folderData);
                setTitle(data.title);
                setDescription(data.description || '');
                setFolderId(data.folder_id || 'fld_root');
                setBody(data.body || '');
                setSourceUrl(data.source_url || '');
                setTagsInput(data.tags.join(', '));
                setIsEditing(startInEditMode);
            } catch {
                toast.error('Could not load content details.');
                onClose();
            } finally {
                setLoading(false);
            }
        };

        fetchDetails().catch(() => undefined);
    }, [contentPieceId, keycloak.token, onClose, startInEditMode]);

    // Load protected file preview
    const isImageFile = !!content?.file?.content_type?.startsWith('image/');
    const isVideoFile = !!content?.file?.content_type?.startsWith('video/');
    const previewFileUrl = content?.file?.file_url || null;

    const handleClose = () => {
        setContent(null);
        setIsEditing(false);
        onClose();
    };

    const handleSave = async () => {
        if (!content) return;
        if (!title.trim()) {
            toast.error('Title is required.');
            return;
        }
        if (content.content_format === 'link' && !sourceUrl.trim()) {
            toast.error('Source URL is required.');
            return;
        }
        if (!content.file && content.content_format !== 'link' && !body.trim()) {
            toast.error('Body is required.');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE}/content/${encodeURIComponent(content.content_piece_id)}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
                },
                body: JSON.stringify({
                    folder_id: folderId,
                    title: title.trim(),
                    description: description.trim() || null,
                    body: content.file || content.content_format === 'link' ? null : body,
                    source_url: content.content_format === 'link' ? sourceUrl.trim() : null,
                    tags: tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
                }),
            });
            if (!res.ok) throw new Error('Failed to update content');
            const updated = await res.json() as ContentDetail;
            setContent(updated);
            setTitle(updated.title);
            setDescription(updated.description || '');
            setFolderId(updated.folder_id || 'fld_root');
            setBody(updated.body || '');
            setSourceUrl(updated.source_url || '');
            setTagsInput(updated.tags.join(', '));
            setIsEditing(false);
            onUpdated();
            toast.success('Content updated successfully.');
            handleClose();
        } catch {
            toast.error('Could not update content.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 truncate">
                                {loading ? 'Loading…' : content?.title ?? 'Content Details'}
                            </h2>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                </div>
                            )}

                            {!loading && content && (
                                <div className="space-y-5">
                                    {/* Title + Actions */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-purple-900">{content.title}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5 font-mono">{content.content_piece_id}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 uppercase">
                                                {content.content_format}
                                            </span>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="space-y-4 rounded-lg border border-purple-100 bg-purple-50/40 p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Title</label>
                                                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Folder</label>
                                                    <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400">
                                                        {sortedFolders.map((folder) => (
                                                            <option key={folder.folder_id} value={folder.folder_id}>{folder.path}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</label>
                                                <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                            </div>
                                            {!content.file && content.content_format !== 'link' && (
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Body</label>
                                                    <textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-28 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                                </div>
                                            )}
                                            {content.content_format === 'link' && (
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Source URL</label>
                                                    <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tags</label>
                                                <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    disabled={isSaving}
                                                    onClick={handleSave}
                                                    className="flex items-center gap-1 rounded-lg bg-purple-700 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
                                                >
                                                    <Save className="w-3 h-3" />
                                                    {isSaving ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Metadata grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm text-gray-700 rounded-lg bg-gray-50 p-4 border border-gray-100">
                                        <div><span className="font-semibold text-gray-900">Kind:</span> {content.kind}</div>
                                        <div><span className="font-semibold text-gray-900">Format:</span> {content.content_format}</div>
                                        <div className="md:col-span-2 break-all"><span className="font-semibold text-gray-900">Path:</span> {content.path}</div>
                                        <div><span className="font-semibold text-gray-900">Created:</span> {new Date(content.created_at).toLocaleString()}</div>
                                        <div><span className="font-semibold text-gray-900">Updated:</span> {new Date(content.updated_at).toLocaleString()}</div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Description</h4>
                                        <p className="text-sm text-gray-700">{content.description || 'No description.'}</p>
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Body</h4>
                                        <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700 max-h-60 overflow-y-auto">
                                            {content.body || 'No text body.'}
                                        </pre>
                                    </div>

                                    {/* Source URL */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Source URL</h4>
                                        {content.source_url ? (
                                            <a
                                                href={content.source_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-purple-700 hover:text-purple-900 underline break-all"
                                            >
                                                {content.source_url}
                                            </a>
                                        ) : (
                                            <p className="text-sm text-gray-500">No source URL.</p>
                                        )}
                                    </div>

                                    {/* File */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1">File</h4>
                                        {content.file ? (
                                            <div className="space-y-1 text-sm text-gray-700">
                                                <p><span className="font-medium text-gray-900">Name:</span> {content.file.filename}</p>
                                                <p><span className="font-medium text-gray-900">Type:</span> {content.file.content_type}</p>
                                                <p><span className="font-medium text-gray-900">Size:</span> {content.file.size} bytes</p>

                                                {previewFileUrl && isImageFile && (
                                                    <div className="pt-3">
                                                        <p className="font-medium text-gray-900 mb-2">Preview</p>
                                                        <img
                                                            src={previewFileUrl}
                                                            alt={content.file.filename}
                                                            className="max-h-72 w-auto rounded-lg border border-gray-200"
                                                        />
                                                    </div>
                                                )}

                                                {previewFileUrl && isVideoFile && (
                                                    <div className="pt-3">
                                                        <p className="font-medium text-gray-900 mb-2">Preview</p>
                                                        <video
                                                            controls
                                                            className="max-h-72 w-full rounded-lg border border-gray-200 bg-black"
                                                        >
                                                            <source src={previewFileUrl} type={content.file.content_type} />
                                                            Your browser does not support the video element.
                                                        </video>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No file attached.</p>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Tags</h4>
                                        {content.tags.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {content.tags.map((tag) => (
                                                    <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-700">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No tags.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
