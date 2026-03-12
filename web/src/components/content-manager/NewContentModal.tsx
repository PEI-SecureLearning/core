import { useMemo, useRef, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, X } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL;

interface NewContentModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    folderPaths?: string[];
}

export function NewContentModal({ open, onClose, onCreated, folderPaths = [] }: NewContentModalProps) {
    const { keycloak } = useKeycloak();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [path, setPath] = useState('');
    const [showPathSuggestions, setShowPathSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const pathContainerRef = useRef<HTMLDivElement>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mode, setMode] = useState<'file' | 'text'>('file');
    const [contentFormat, setContentFormat] = useState<'text' | 'markdown' | 'html' | 'link'>('text');
    const [body, setBody] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const pathSuggestions = useMemo(() => {
        if (!path.trim() || !showPathSuggestions) return folderPaths;
        const query = path.toLowerCase();
        return folderPaths.filter((p) => p.toLowerCase().includes(query) && p.toLowerCase() !== query);
    }, [path, folderPaths, showPathSuggestions]);

    const resetForm = () => {
        setPath('');
        setTitle('');
        setDescription('');
        setMode('file');
        setContentFormat('text');
        setBody('');
        setSourceUrl('');
        setTagsInput('');
        setFile(null);
    };

    const normalizeContentPath = (rawPath: string) => {
        const trimmed = rawPath.trim().replace(/^\/+/, '');
        if (!trimmed) return 'content/';
        if (trimmed === 'content' || trimmed === 'content/') return 'content/';
        return trimmed.startsWith('content/') ? trimmed : `content/${trimmed}`;
    };

    const parseTags = (input: string) =>
        input
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);

    const getCreateValidationError = () => {
        if (!path.trim()) return 'Path is required.';
        if (!title.trim()) return 'Title is required.';

        if (mode === 'file') {
            if (!file) return 'Select a file to upload.';
            return null;
        }

        if (contentFormat === 'link' && !sourceUrl.trim()) {
            return 'Source URL is required for link content.';
        }

        if (contentFormat !== 'link' && !body.trim()) {
            return 'Body is required for text/markdown/html content.';
        }

        return null;
    };

    const createFileContent = async (normalizedPath: string, parsedTags: string[], selectedFile: File) => {
        const formData = new FormData();
        formData.append('path', normalizedPath);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('tags', parsedTags.join(','));
        formData.append('file', selectedFile);

        const res = await fetch(`${API_BASE}/content/upload`, {
            method: 'POST',
            headers: {
                Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
            },
            body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');
    };

    const createTextContent = async (normalizedPath: string, parsedTags: string[]) => {
        const res = await fetch(`${API_BASE}/content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
            },
            body: JSON.stringify({
                path: normalizedPath,
                title,
                description: description || null,
                content_format: contentFormat,
                body: contentFormat === 'link' ? null : body,
                source_url: contentFormat === 'link' ? sourceUrl : null,
                tags: parsedTags,
            }),
        });

        if (!res.ok) throw new Error('Content creation failed');
    };

    const handleCreateContent = async (event: React.FormEvent) => {
        event.preventDefault();
        const validationError = getCreateValidationError();
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setIsSubmitting(true);
        try {
            const parsedTags = parseTags(tagsInput);
            const normalizedPath = normalizeContentPath(path);

            if (mode === 'file' && file) {
                await createFileContent(normalizedPath, parsedTags, file);
            } else {
                await createTextContent(normalizedPath, parsedTags);
            }

            toast.success('Content created successfully.');
            resetForm();
            onCreated();
            onClose();
        } catch {
            toast.error('Could not create content.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 transition-shadow";

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="w-full max-w-lg max-h-[85vh] bg-surface rounded-xl shadow-2xl overflow-hidden flex flex-col border border-border"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-bold text-foreground">New File</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCreateContent} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                            <div className="space-y-1 relative" ref={pathContainerRef}>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Path</label>
                                <input
                                    value={path}
                                    onChange={(e) => {
                                        setPath(e.target.value);
                                        setShowPathSuggestions(true);
                                        setHighlightedIndex(-1);
                                    }}
                                    onFocus={() => setShowPathSuggestions(true)}
                                    onBlur={() => {
                                        // Delay to allow click on suggestion
                                        setTimeout(() => setShowPathSuggestions(false), 150);
                                    }}
                                    onKeyDown={(e) => {
                                        if (!showPathSuggestions || pathSuggestions.length === 0) return;
                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            setHighlightedIndex((i) => Math.min(i + 1, pathSuggestions.length - 1));
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            setHighlightedIndex((i) => Math.max(i - 1, 0));
                                        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                                            e.preventDefault();
                                            setPath(pathSuggestions[highlightedIndex]);
                                            setShowPathSuggestions(false);
                                            setHighlightedIndex(-1);
                                        } else if (e.key === 'Escape') {
                                            setShowPathSuggestions(false);
                                        }
                                    }}
                                    placeholder="e.g. courses/security/module-1/content-1"
                                    className={inputClass}
                                    autoComplete="off"
                                />
                                {showPathSuggestions && pathSuggestions.length > 0 && (
                                    <div className="absolute z-30 left-0 right-0 top-full mt-1 max-h-44 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
                                        {pathSuggestions.map((suggestion, idx) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    setPath(suggestion);
                                                    setShowPathSuggestions(false);
                                                    setHighlightedIndex(-1);
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors ${idx === highlightedIndex
                                                    ? 'bg-[#7C3AED]/15 text-[#A78BFA]'
                                                    : 'text-foreground hover:bg-surface-subtle'
                                                    }`}
                                            >
                                                <Folder className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" />
                                                <span className="truncate">{suggestion}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Content title"
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description"
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content Mode</label>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as 'file' | 'text')}
                                    className={inputClass}
                                >
                                    <option value="file">Upload file</option>
                                    <option value="text">Write text</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</label>
                                <input
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    placeholder="Comma separated tags"
                                    className={inputClass}
                                />
                            </div>

                            {mode === 'file' ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">File</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className={inputClass}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Format</label>
                                        <select
                                            value={contentFormat}
                                            onChange={(e) => setContentFormat(e.target.value as 'text' | 'markdown' | 'html' | 'link')}
                                            className={inputClass}
                                        >
                                            <option value="text">Text</option>
                                            <option value="markdown">Markdown</option>
                                            <option value="html">HTML</option>
                                            <option value="link">Link</option>
                                        </select>
                                    </div>

                                    {contentFormat === 'link' ? (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source URL</label>
                                            <input
                                                value={sourceUrl}
                                                onChange={(e) => setSourceUrl(e.target.value)}
                                                placeholder="https://..."
                                                className={inputClass}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Body</label>
                                            <textarea
                                                value={body}
                                                onChange={(e) => setBody(e.target.value)}
                                                placeholder="Body content"
                                                className={`${inputClass} min-h-28 resize-y`}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-surface-subtle transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}
                                    className="rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-[0_0_16px_rgba(124,58,237,0.4)] transition-all duration-200 disabled:opacity-60 active:scale-[0.97]"
                                >
                                    {isSubmitting ? 'Saving...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
