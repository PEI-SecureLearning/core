import { useEffect, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL;

type ContentDetail = {
    content_piece_id: string;
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
        file_url?: string | null;
        data_base64?: string | null;
    } | null;
    created_at: string;
    updated_at: string;
};

interface ViewContentModalProps {
    contentPieceId: string | null;
    onClose: () => void;
    onDeleted: () => void;
}

export function ViewContentModal({ contentPieceId, onClose, onDeleted }: ViewContentModalProps) {
    const { keycloak } = useKeycloak();
    const [content, setContent] = useState<ContentDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [protectedPreviewUrl, setProtectedPreviewUrl] = useState<string | null>(null);

    const open = !!contentPieceId;

    // Fetch content details when contentPieceId changes
    useEffect(() => {
        if (!contentPieceId) {
            setContent(null);
            return;
        }

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/content/${encodeURIComponent(contentPieceId)}`, {
                    headers: {
                        Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
                    },
                });
                if (!res.ok) throw new Error('Failed to load details');
                const data = await res.json();
                setContent(data);
            } catch {
                toast.error('Could not load content details.');
                onClose();
            } finally {
                setLoading(false);
            }
        };

        fetchDetails().catch(() => undefined);
    }, [contentPieceId, keycloak.token]);

    // Load protected file preview
    const isImageFile = !!content?.file?.content_type?.startsWith('image/');
    const isVideoFile = !!content?.file?.content_type?.startsWith('video/');
    const inlineFileDataUrl =
        content?.file?.data_base64 && content.file.content_type
            ? `data:${content.file.content_type};base64,${content.file.data_base64}`
            : null;
    const previewFileUrl = inlineFileDataUrl || protectedPreviewUrl;

    useEffect(() => {
        if (!content?.file || inlineFileDataUrl) {
            setProtectedPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            return;
        }

        const loadPreview = async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/content/${encodeURIComponent(content.content_piece_id)}/file`,
                    {
                        headers: {
                            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
                        },
                    }
                );
                if (!res.ok) throw new Error('Failed to load preview');
                const blob = await res.blob();
                const objectUrl = URL.createObjectURL(blob);
                setProtectedPreviewUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return objectUrl;
                });
            } catch {
                setProtectedPreviewUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return null;
                });
            }
        };

        void loadPreview();

        return () => {
            setProtectedPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
    }, [content?.content_piece_id, content?.file, inlineFileDataUrl, keycloak.token]);

    const handleDelete = async () => {
        if (!content) return;
        const confirmed = window.confirm('Delete this content piece?');
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const res = await fetch(
                `${API_BASE}/content/${encodeURIComponent(content.content_piece_id)}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
                    },
                }
            );
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Content deleted successfully.');
            onDeleted();
            onClose();
        } catch {
            toast.error('Could not delete content.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        setProtectedPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setContent(null);
        onClose();
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
                        className="w-full max-w-2xl max-h-[85vh] bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-bold text-foreground truncate">
                                {loading ? 'Loading…' : content?.title ?? 'Content Details'}
                            </h2>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#A78BFA]" />
                                </div>
                            )}

                            {!loading && content && (
                                <div className="space-y-5">
                                    {/* Title + Actions */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-[#A78BFA]">{content.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{content.content_piece_id}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#7C3AED]/15 text-[#A78BFA] uppercase">
                                                {content.content_format}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={isDeleting}
                                                onClick={handleDelete}
                                                className="flex items-center gap-1 rounded-lg border border-red-400/30 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-60 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                {isDeleting ? 'Deleting…' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Metadata grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm text-foreground rounded-lg bg-surface-subtle p-4 border border-border">
                                        <div><span className="font-semibold text-foreground">Kind:</span> <span className="text-muted-foreground">{content.kind}</span></div>
                                        <div><span className="font-semibold text-foreground">Format:</span> <span className="text-muted-foreground">{content.content_format}</span></div>
                                        <div className="md:col-span-2 break-all"><span className="font-semibold text-foreground">Path:</span> <span className="text-muted-foreground">{content.path}</span></div>
                                        <div><span className="font-semibold text-foreground">Created:</span> <span className="text-muted-foreground">{new Date(content.created_at).toLocaleString()}</span></div>
                                        <div><span className="font-semibold text-foreground">Updated:</span> <span className="text-muted-foreground">{new Date(content.updated_at).toLocaleString()}</span></div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-1">Description</h4>
                                        <p className="text-sm text-muted-foreground">{content.description || 'No description.'}</p>
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-1">Body</h4>
                                        <pre className="whitespace-pre-wrap rounded-lg bg-surface-subtle border border-border p-3 text-sm text-muted-foreground max-h-60 overflow-y-auto">
                                            {content.body || 'No text body.'}
                                        </pre>
                                    </div>

                                    {/* Source URL */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-1">Source URL</h4>
                                        {content.source_url ? (
                                            <a
                                                href={content.source_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-[#A78BFA] hover:text-[#7C3AED] underline break-all"
                                            >
                                                {content.source_url}
                                            </a>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No source URL.</p>
                                        )}
                                    </div>

                                    {/* File */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-1">File</h4>
                                        {content.file ? (
                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                <p><span className="font-medium text-foreground">Name:</span> {content.file.filename}</p>
                                                <p><span className="font-medium text-foreground">Type:</span> {content.file.content_type}</p>
                                                <p><span className="font-medium text-foreground">Size:</span> {content.file.size} bytes</p>

                                                {previewFileUrl && isImageFile && (
                                                    <div className="pt-3">
                                                        <p className="font-medium text-foreground mb-2">Preview</p>
                                                        <img
                                                            src={previewFileUrl}
                                                            alt={content.file.filename}
                                                            className="max-h-72 w-auto rounded-lg border border-border"
                                                        />
                                                    </div>
                                                )}

                                                {previewFileUrl && isVideoFile && (
                                                    <div className="pt-3">
                                                        <p className="font-medium text-foreground mb-2">Preview</p>
                                                        <video
                                                            controls
                                                            className="max-h-72 w-full rounded-lg border border-border bg-black"
                                                        >
                                                            <source src={previewFileUrl} type={content.file.content_type} />
                                                            Your browser does not support the video element.
                                                        </video>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No file attached.</p>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-1">Tags</h4>
                                        {content.tags.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {content.tags.map((tag) => (
                                                    <span key={tag} className="px-2 py-1 rounded-full bg-surface-subtle border border-border text-xs text-muted-foreground">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No tags.</p>
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
