import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Eye, FilePenLine, FileStack, Folder, FolderOpen, FolderPlus, Plus, Search, SortAsc, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { NewContentModal } from '../NewContentModal';

const API_BASE = import.meta.env.VITE_API_URL;
const ROOT_FOLDER_ID = 'fld_root';

const compareAlphabetically = (left: string, right: string) =>
    left.localeCompare(right, undefined, {
        sensitivity: 'base',
        numeric: true,
    });

type ContentItem = {
    id: string;
    content_piece_id: string;
    folder_id: string | null;
    path: string;
    title: string;
    description: string | null;
    content_format: string;
    created_at: string;
    file: {
        filename: string;
        content_type: string;
        size: number;
        storage?: 'garage' | null;
        object_key?: string | null;
        etag?: string | null;
        file_url?: string | null;
    } | null;
};

type ContentFolder = {
    id: string;
    folder_id: string;
    name: string;
    parent_folder_id: string | null;
    file_ids: string[];
    path: string;
};

interface ContentDisplayProps {
    searchQuery: string;
    sortBy: string;
    refreshKey: number;
    openNewModal?: boolean;
    onViewContent: (contentPieceId: string) => void;
    onEditContent: (contentPieceId: string) => void;
    onDeleteContent: (contentPieceId: string) => void;
    onSearchChange: (value: string) => void;
    onSortChange: (value: string) => void;
    onContentCreated: () => void;
}

export function ContentDisplay({
    searchQuery,
    sortBy,
    refreshKey,
    openNewModal,
    onViewContent,
    onEditContent,
    onDeleteContent,
    onSearchChange,
    onSortChange,
    onContentCreated,
}: ContentDisplayProps) {
    const { keycloak } = useKeycloak();
    const [showNewModal, setShowNewModal] = useState(false);
    const [items, setItems] = useState<ContentItem[]>([]);
    const [folders, setFolders] = useState<ContentFolder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState(ROOT_FOLDER_ID);
    const [creatingFolderIn, setCreatingFolderIn] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([ROOT_FOLDER_ID]));

    useEffect(() => {
        if (openNewModal) setShowNewModal(true);
    }, [openNewModal]);

    useEffect(() => {
        const headers = {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
        };

        const fetchData = async () => {
            try {
                const [contentRes, foldersRes] = await Promise.all([
                    fetch(`${API_BASE}/content`, { headers }),
                    fetch(`${API_BASE}/content/folders`, { headers }),
                ]);
                if (!contentRes.ok || !foldersRes.ok) throw new Error('Failed to fetch content');
                const contentData = await contentRes.json() as ContentItem[];
                const folderData = await foldersRes.json() as ContentFolder[];
                setItems(contentData);
                setFolders(folderData);
                if (!folderData.some((folder) => folder.folder_id === selectedFolderId)) {
                    setSelectedFolderId(ROOT_FOLDER_ID);
                }
            } catch {
                toast.error('Could not load content.');
            }
        };

        fetchData().catch(() => undefined);
    }, [keycloak.token, refreshKey]);

    const foldersById = useMemo(() => {
        const map = new Map<string, ContentFolder>();
        for (const folder of folders) map.set(folder.folder_id, folder);
        return map;
    }, [folders]);

    const folderChildren = useMemo(() => {
        const map = new Map<string, ContentFolder[]>();
        for (const folder of folders) {
            const parentId = folder.parent_folder_id ?? '';
            if (!map.has(parentId)) map.set(parentId, []);
            map.get(parentId)!.push(folder);
        }
        for (const [key, value] of map) {
            map.set(key, [...value].sort((a, b) => compareAlphabetically(a.name, b.name)));
        }
        return map;
    }, [folders]);

    const selectedFolder = foldersById.get(selectedFolderId);
    const selectedFolderPath = selectedFolder?.path ?? 'content';

    const filteredCurrentItems = useMemo(() => {
        let list = items.filter((item) => (item.folder_id ?? ROOT_FOLDER_ID) === selectedFolderId);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((item) =>
                item.title.toLowerCase().includes(q) ||
                item.description?.toLowerCase().includes(q) ||
                item.path.toLowerCase().includes(q)
            );
        }
        if (sortBy === 'id') {
            return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        return [...list].sort((a, b) => compareAlphabetically(a.title, b.title));
    }, [items, selectedFolderId, searchQuery, sortBy]);

    const visibleFolders = useMemo(() => {
        let list = folderChildren.get(selectedFolderId) ?? [];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((folder) => folder.name.toLowerCase().includes(q) || folder.path.toLowerCase().includes(q));
        }
        return list;
    }, [folderChildren, selectedFolderId, searchQuery]);

    const toggleFolder = (folderId: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) next.delete(folderId);
            else next.add(folderId);
            return next;
        });
    };

    const startCreatingFolder = () => {
        setCreatingFolderIn(selectedFolderId);
        setNewFolderName('');
        setExpandedFolders((prev) => new Set([...prev, selectedFolderId]));
    };

    const confirmCreateFolder = async () => {
        const name = newFolderName.trim();
        const parentFolderId = creatingFolderIn;
        if (!name || !parentFolderId) {
            setCreatingFolderIn(null);
            setNewFolderName('');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/content/folders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
                },
                body: JSON.stringify({ name, parent_folder_id: parentFolderId }),
            });
            if (!res.ok) throw new Error('Failed to create folder');
            const created = await res.json() as ContentFolder;
            setFolders((prev) => [...prev, created]);
            setExpandedFolders((prev) => new Set([...prev, parentFolderId, created.folder_id]));
            setSelectedFolderId(created.folder_id);
        } catch {
            toast.error('Could not create folder.');
        } finally {
            setCreatingFolderIn(null);
            setNewFolderName('');
        }
    };

    const cancelCreateFolder = () => {
        setCreatingFolderIn(null);
        setNewFolderName('');
    };

    const renderTree = (parentFolderId: string | null, level = 0): ReactNode[] => {
        const key = parentFolderId ?? '';
        const children = folderChildren.get(key) || [];
        return children.map((folder) => {
            const isExpanded = expandedFolders.has(folder.folder_id);
            const isSelected = selectedFolderId === folder.folder_id;
            const hasChildren = (folderChildren.get(folder.folder_id) || []).length > 0;
            return (
                <div key={folder.folder_id}>
                    <button
                        type="button"
                        onClick={() => setSelectedFolderId(folder.folder_id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm ${isSelected ? 'bg-primary/15 text-accent-secondary' : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'}`}
                        style={{ paddingLeft: `${8 + level * 14}px` }}
                    >
                        {hasChildren ? (
                            <ChevronRight
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    toggleFolder(folder.folder_id);
                                }}
                            />
                        ) : (
                            <span className="w-3" />
                        )}
                        {isExpanded ? <FolderOpen className="w-4 h-4 text-accent-secondary" /> : <Folder className="w-4 h-4 text-accent-secondary" />}
                        <span className="truncate">{folder.name}</span>
                    </button>
                    {isExpanded && (
                        <div>
                            {hasChildren && renderTree(folder.folder_id, level + 1)}
                            {creatingFolderIn === folder.folder_id && (
                                <div className="flex items-center gap-1.5 py-1" style={{ paddingLeft: `${8 + (level + 1) * 14}px` }}>
                                    <Folder className="w-4 h-4 text-accent-secondary shrink-0" />
                                    <input
                                        autoFocus
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') void confirmCreateFolder();
                                            if (e.key === 'Escape') cancelCreateFolder();
                                        }}
                                        onBlur={() => { void confirmCreateFolder(); }}
                                        placeholder="folder name"
                                        className="flex-1 min-w-0 rounded border border-primary/40 px-1.5 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary bg-surface"
                                    />
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { void confirmCreateFolder(); }} className="p-0.5 rounded text-emerald-500 hover:bg-emerald-500/10" title="Confirm">
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={cancelCreateFolder} className="p-0.5 rounded text-muted-foreground hover:bg-surface-subtle" title="Cancel">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <motion.div animate={{ opacity: 1 }} className="w-full h-full flex gap-4">
            <aside className="w-72 min-w-72 bg-surface rounded-b-xl rounded-t-sm border border-border p-3 overflow-y-auto shadow-md">
                <div className="flex items-center justify-between mb-2 border-b-2 border-border">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Folders</p>
                    <button type="button" onClick={startCreatingFolder} title="Create folder" className="p-1 rounded-md text-muted-foreground hover:text-accent-secondary hover:bg-primary/10 transition-colors">
                        <FolderPlus className="w-4 h-4" />
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => setSelectedFolderId(ROOT_FOLDER_ID)}
                    className={`mb-1 w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${selectedFolderId === ROOT_FOLDER_ID ? 'bg-primary/15 text-accent-secondary' : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'}`}
                >
                    <FolderOpen className="w-4 h-4 text-accent-secondary" />
                    <span className="truncate">content</span>
                </button>
                {creatingFolderIn === ROOT_FOLDER_ID && (
                    <div className="mb-1 flex items-center gap-1.5 py-1 pl-8">
                        <Folder className="w-4 h-4 text-[#A78BFA] shrink-0" />
                        <input
                            autoFocus
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') void confirmCreateFolder();
                                if (e.key === 'Escape') cancelCreateFolder();
                            }}
                            onBlur={() => { void confirmCreateFolder(); }}
                            placeholder="folder name"
                            className="flex-1 min-w-0 rounded border border-[#7C3AED]/40 px-1.5 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C3AED] bg-surface"
                        />
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { void confirmCreateFolder(); }} className="p-0.5 rounded text-emerald-500 hover:bg-emerald-500/10" title="Confirm">
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={cancelCreateFolder} className="p-0.5 rounded text-muted-foreground hover:bg-surface-subtle" title="Cancel">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
                <div className="space-y-1">{renderTree(ROOT_FOLDER_ID)}</div>
            </aside>

            <div className="flex-1 bg-surface rounded-b-xl rounded-t-sm border border-border overflow-y-auto">
                <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <div className="text-sm shrink-0">
                        <span className="font-semibold text-foreground">{selectedFolderPath}</span>
                        <span className="text-muted-foreground"> ({visibleFolders.length + filteredCurrentItems.length} items)</span>
                    </div>

                    <div className="flex-1" />

                    <div className="relative w-56">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search current folder…"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full bg-surface border border-border rounded-lg py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="relative">
                        <SortAsc className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className="bg-surface border border-border rounded-lg py-1.5 pl-8 pr-6 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 cursor-pointer text-foreground">
                            <option value="title">Sort by Name</option>
                            <option value="id">Newest First</option>
                        </select>
                    </div>

                    <button type="button" onClick={() => setShowNewModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all duration-200 active:scale-[0.97]">
                        <Plus className="w-3.5 h-3.5" />
                        File
                    </button>
                </div>

                <div className="divide-y divide-border">
                    {visibleFolders.map((folder) => (
                        <button key={folder.folder_id} type="button" onClick={() => setSelectedFolderId(folder.folder_id)} className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-surface-subtle text-left transition-colors">
                            <div className="min-w-0 flex items-center gap-3">
                                <Folder className="w-4 h-4 text-accent-secondary shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{folder.path}</p>
                                </div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-surface-subtle text-muted-foreground uppercase border border-border">Folder</span>
                        </button>
                    ))}

                    {filteredCurrentItems.map((item) => (
                        <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-surface-subtle transition-colors">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.path}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-accent-secondary uppercase">{item.content_format}</span>
                                <button onClick={() => onViewContent(item.content_piece_id)} aria-label="Open content" title="Open" className="p-1 rounded text-accent-secondary hover:text-accent-secondary/80 hover:bg-primary/10">
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => onEditContent(item.content_piece_id)} aria-label="Edit content" title="Edit" className="p-1 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-500/10">
                                    <FilePenLine className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDeleteContent(item.content_piece_id)} aria-label="Delete content" title="Delete" className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {visibleFolders.length === 0 && filteredCurrentItems.length === 0 && (
                        <div className="px-4 py-8 text-sm text-muted-foreground flex items-center gap-2">
                            <FileStack className="w-4 h-4" />
                            No content in this folder.
                        </div>
                    )}
                </div>
            </div>

            <NewContentModal
                open={showNewModal}
                onClose={() => setShowNewModal(false)}
                onCreated={onContentCreated}
                folders={folders}
                defaultFolderId={selectedFolderId}
            />
        </motion.div>
    );
}
