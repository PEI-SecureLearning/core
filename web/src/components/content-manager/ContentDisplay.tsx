import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { motion } from 'framer-motion';
import { ChevronRight, Eye, FileStack, Folder, FolderOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL;

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
}

export function ContentDisplay({
    searchQuery,
    sortBy,
    refreshKey,
    onViewContent,
    onDeleteContent,
}: ContentDisplayProps) {
    const { keycloak } = useKeycloak();
    const [items, setItems] = useState<ContentItem[]>([]);
    const [selectedDir, setSelectedDir] = useState("content");
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

        void fetchContent();
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

        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
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
        return Array.from(dirs).sort();
    }, [filteredContent]);

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
            map.set(key, value.sort());
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
                        {isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />}
                        <span className="truncate">{label}</span>
                    </button>
                    {isExpanded && hasChildren && <div>{renderTree(dir, level + 1)}</div>}
                </div>
            );
        });
    };

    return (
        <motion.div
            animate={{ opacity: 1 }}
            className="w-full h-full flex gap-4"
        >
            <aside className="w-72 min-w-72 bg-white rounded-xl border border-gray-200 p-3 overflow-y-auto">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Directories</p>
                <div className="space-y-1">{renderTree("")}</div>
            </aside>

            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-sm">
                        <span className="font-semibold text-gray-900">{selectedDir}</span>
                        <span className="text-gray-500"> ({visibleItems.length} items)</span>
                    </div>
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
        </motion.div >
    );
}
