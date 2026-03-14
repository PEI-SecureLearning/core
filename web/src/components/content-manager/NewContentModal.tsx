import { useMemo, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, X } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL;

type ContentCollection = {
    collection_id: string;
    name: string;
    path: string;
};

interface NewContentModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    collections?: ContentCollection[];
    defaultCollectionId?: string;
}

export function NewContentModal({
    open,
    onClose,
    onCreated,
    collections = [],
    defaultCollectionId,
}: NewContentModalProps) {
    const { keycloak } = useKeycloak();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCollectionId, setSelectedCollectionId] = useState(defaultCollectionId ?? 'col_root');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mode, setMode] = useState<'file' | 'text'>('file');
    const [contentFormat, setContentFormat] = useState<'text' | 'markdown' | 'html' | 'link'>('text');
    const [body, setBody] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const sortedCollections = useMemo(
        () => [...collections].sort((left, right) => left.path.localeCompare(right.path, undefined, { sensitivity: 'base', numeric: true })),
        [collections]
    );

    const resetForm = () => {
        setSelectedCollectionId(defaultCollectionId ?? 'col_root');
        setTitle('');
        setDescription('');
        setMode('file');
        setContentFormat('text');
        setBody('');
        setSourceUrl('');
        setTagsInput('');
        setFile(null);
    };

    const parseTags = (input: string) =>
        input
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);

    const getCreateValidationError = () => {
        if (!selectedCollectionId) return 'A destination folder is required.';
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

    const createFileContent = async (parsedTags: string[], selectedFile: File) => {
        const formData = new FormData();
        formData.append('collection_id', selectedCollectionId);
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

    const createTextContent = async (parsedTags: string[]) => {
        const res = await fetch(`${API_BASE}/content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
            },
            body: JSON.stringify({
                collection_id: selectedCollectionId,
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

            if (mode === 'file' && file) {
                await createFileContent(parsedTags, file);
            } else {
                await createTextContent(parsedTags);
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

    const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-shadow';

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
                        className="w-full max-w-lg max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">New File</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateContent} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Folder</label>
                                <div className="relative">
                                    <Folder className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
                                    <select
                                        value={selectedCollectionId}
                                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                                        className={`${inputClass} pl-9`}
                                    >
                                        {sortedCollections.map((collection) => (
                                            <option key={collection.collection_id} value={collection.collection_id}>
                                                {collection.path}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Title</label>
                                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Content title" className={inputClass} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className={inputClass} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Content Mode</label>
                                <select value={mode} onChange={(e) => setMode(e.target.value as 'file' | 'text')} className={inputClass}>
                                    <option value="file">Upload file</option>
                                    <option value="text">Write text</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</label>
                                <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Comma separated tags" className={inputClass} />
                            </div>

                            {mode === 'file' ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">File</label>
                                    <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className={inputClass} />
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Format</label>
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
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source URL</label>
                                            <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." className={inputClass} />
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Body</label>
                                            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body content" className={`${inputClass} min-h-28 resize-y`} />
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-60 active:scale-[0.97]"
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
