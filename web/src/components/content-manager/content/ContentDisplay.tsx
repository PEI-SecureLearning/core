import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Eye, FileStack, Folder, FolderOpen, FolderPlus, Plus, Search, SortAsc, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { NewContentModal } from './NewContentModal';

const API_BASE = import.meta.env.VITE_API_URL;

const compareAlphabetically = (left: string, right: string) =>
    left.localeCompare(right, undefined, {
        sensitivity: "base",
        numeric: true,
    });

type ContentItem = {
    id: string;
    content_piece_id: string;
    path: string;
    title: string;
    description: string | null;
    content_format: string;
    created_at: string;
    file: {
        filename: string;
        content_type: string;
        size: number;
        data_base64?: string | null;
    } | null;
};

interface ContentDisplayProps {
    searchQuery: string;
    sortBy: string;
    refreshKey: number;
    onViewContent: (contentPieceId: string) => void;
    onDeleteContent: (contentPieceId: string) => void;
    onSearchChange: (value: string) => void;
    onSortChange: (value: string) => void;
    onContentCreated: () => void;
}

export function ContentDisplay({
    searchQuery,
    sortBy,
    refreshKey,
    onViewContent,
    onDeleteContent,
    onSearchChange,
    onSortChange,
    onContentCreated,
}: ContentDisplayProps) {
    const { keycloak } = useKeycloak();
    const [showNewModal, setShowNewModal] = useState(false);
    const [items, setItems] = useState<ContentItem[]>([]);
    const [selectedDir, setSelectedDir] = useState("content");
    const [customDirs, setCustomDirs] = useState<Set<string>>(new Set());
    const [creatingFolderIn, setCreatingFolderIn] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState("");
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["content"]));

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await fetch(`${API_BASE}/content`, {
                    headers: {
                        Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                    },
                });
                if (!res.ok) {
                    throw new Error("Failed to fetch content");
                }
                const data = await res.json() as ContentItem[];
                setItems(data);
            } catch {
                toast.error("Could not load content.");
            }
        };

        fetchContent().catch(() => undefined);
    }, [keycloak.token, refreshKey]);

    const filteredContent = useMemo(() => {
        const filtered = items.filter((item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.path.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (sortBy === "id") {
            return [...filtered].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }

        return [...filtered].sort((a, b) => compareAlphabetically(a.title, b.title));
    }, [items, searchQuery, sortBy]);

    const directoryPaths = useMemo(() => {
        const dirs = new Set<string>(["content"]);
        for (const item of filteredContent) {
            const parts = item.path.replace(/^\/+/, "").split("/").filter(Boolean);
            let current = "";
            for (const part of parts) {
                current = current ? `${current}/${part}` : part;
                dirs.add(current);
            }
        }
        for (const dir of customDirs) {
            dirs.add(dir);
        }
        return Array.from(dirs).sort(compareAlphabetically);
    }, [filteredContent, customDirs]);

    const directoryChildren = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const dir of directoryPaths) {
            const parts = dir.split("/");
            const parent = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
            if (!map.has(parent)) {
                map.set(parent, []);
            }
            map.get(parent)!.push(dir);
        }
        for (const [key, value] of map) {
            const sorted = [...value].sort(compareAlphabetically);
            map.set(key, sorted);
        }
        return map;
    }, [directoryPaths]);

    const visibleItems = useMemo(
        () =>
            filteredContent.filter((item) =>
                item.path === selectedDir || item.path.startsWith(`${selectedDir}/`)
            ),
        [filteredContent, selectedDir]
    );

    const toggleDir = (dir: string) => {
        setExpandedDirs((prev) => {
            const next = new Set(prev);
            if (next.has(dir)) {
                next.delete(dir);
            } else {
                next.add(dir);
            }
            return next;
        });
    };

    const startCreatingFolder = () => {
        setCreatingFolderIn(selectedDir);
        setNewFolderName("");
        setExpandedDirs((prev) => new Set([...prev, selectedDir]));
    };

    const confirmCreateFolder = () => {
        const name = newFolderName.trim();
        if (!name || !creatingFolderIn) {
            setCreatingFolderIn(null);
            setNewFolderName("");
            return;
        }
        const newPath = `${creatingFolderIn}/${name}`;
        setCustomDirs((prev) => new Set([...prev, newPath]));
        setExpandedDirs((prev) => new Set([...prev, creatingFolderIn!, newPath]));
        setSelectedDir(newPath);
        setCreatingFolderIn(null);
        setNewFolderName("");
    };

    const cancelCreateFolder = () => {
        setCreatingFolderIn(null);
        setNewFolderName("");
    };

    const renderTree = (parent: string, level = 0): ReactNode[] => {
        const children = directoryChildren.get(parent) || [];
        return children.map((dir) => {
            const isExpanded = expandedDirs.has(dir);
            const isSelected = selectedDir === dir;
            const label = dir.split("/").pop() || dir;
            const hasChildren = (directoryChildren.get(dir) || []).length > 0;
            return (
                <div key={dir}>
                    <button
                        type="button"
                        onClick={() => setSelectedDir(dir)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm ${isSelected ? "bg-purple-100 text-purple-900" : "text-gray-700 hover:bg-gray-100"
                            }`}
                        style={{ paddingLeft: `${8 + level * 14}px` }}
                    >
                        {hasChildren ? (
                            <ChevronRight
                                className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    toggleDir(dir);
                                }}
                            />
                        ) : (
                            <span className="w-3" />
                        )}
                        {isExpanded ? <FolderOpen className="w-4 h-4 text-purple-500" /> : <Folder className="w-4 h-4 text-purple-500" />}
                        <span className="truncate">{label}</span>
                    </button>
                    {isExpanded && (
                        <div>
                            {hasChildren && renderTree(dir, level + 1)}
                            {creatingFolderIn === dir && (
                                <div
                                    className="flex items-center gap-1.5 py-1"
                                    style={{ paddingLeft: `${8 + (level + 1) * 14}px` }}
                                >
                                    <Folder className="w-4 h-4 text-purple-500 shrink-0" />
                                    <input
                                        autoFocus
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') confirmCreateFolder();
                                            if (e.key === 'Escape') cancelCreateFolder();
                                        }}
                                        onBlur={confirmCreateFolder}
                                        placeholder="folder name"
                                        className="flex-1 min-w-0 rounded border border-purple-300 px-1.5 py-0.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-purple-50/50"
                                    />
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={confirmCreateFolder}
                                        className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50"
                                        title="Confirm"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={cancelCreateFolder}
                                        className="p-0.5 rounded text-gray-400 hover:bg-gray-100"
                                        title="Cancel"
                                    >
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
        <motion.div
            animate={{ opacity: 1 }}
            className="w-full h-full flex gap-4"
        >
            <aside className="w-72 min-w-72 bg-white rounded-b-xl rounded-t-sm border border-gray-200 p-3 overflow-y-auto shadow-md">
                <div className="flex items-center justify-between mb-2 border-b-2 border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Directories</p>
                    <button
                        type="button"
                        onClick={startCreatingFolder}
                        title="Create folder"
                        className="p-1 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                        <FolderPlus className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-1">{renderTree("")}</div>
            </aside>

            <div className="flex-1 bg-white rounded-b-xl rounded-t-sm border border-gray-200 overflow-y-auto shadow-md">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                    <div className="text-sm shrink-0">
                        <span className="font-semibold text-gray-900">{selectedDir}</span>
                        <span className="text-gray-500"> ({visibleItems.length} items)</span>
                    </div>

                    <div className="flex-1" />

                    {/* Search */}
                    <div className="relative w-56">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search content…"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <SortAsc className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg py-1.5 pl-8 pr-6 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer text-gray-600"
                        >
                            <option value="title">Sort by Name</option>
                            <option value="id">Newest First</option>
                        </select>
                    </div>

                    {/* New Content */}
                    <button
                        type="button"
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:from-purple-700 hover:to-purple-800 transition-all duration-200 active:scale-[0.97]"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        File
                    </button>
                </div>
                <div className="divide-y divide-gray-100">
                    {visibleItems.map((item) => (
                        <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-50">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                <p className="text-xs text-gray-500 truncate">{item.path}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 uppercase">
                                    {item.content_format}
                                </span>
                                <button
                                    onClick={() => onViewContent(item.content_piece_id)}
                                    aria-label="Open content"
                                    title="Open"
                                    className="p-1 rounded text-purple-700 hover:text-purple-900 hover:bg-purple-50"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDeleteContent(item.content_piece_id)}
                                    aria-label="Delete content"
                                    title="Delete"
                                    className="p-1 rounded text-red-700 hover:text-red-900 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {visibleItems.length === 0 && (
                        <div className="px-4 py-8 text-sm text-gray-500 flex items-center gap-2">
                            <FileStack className="w-4 h-4" />
                            No content in this directory.
                        </div>
                    )}
                </div>
            </div>
            <NewContentModal
                open={showNewModal}
                onClose={() => setShowNewModal(false)}
                onCreated={onContentCreated}
                folderPaths={directoryPaths}
            />
        </motion.div >
    );
}
