import { useEffect, useMemo, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { motion } from 'framer-motion';
import { FileStack } from 'lucide-react';
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
}

export function ContentDisplay({ searchQuery, sortBy, refreshKey, onViewContent }: ContentDisplayProps) {
    const { keycloak } = useKeycloak();
    const [items, setItems] = useState<ContentItem[]>([]);

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

    return (
        <motion.div
            animate={{ opacity: 1 }}
            className="w-full h-full"
        >

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto">
                {filteredContent.map((item) => (
                    <div key={item.id} className="shadow-black/40 group flex flex-col bg-white rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]">
                        {/* Image Container */}
                        <div className="relative h-48 w-full overflow-hidden bg-white">
                            <div className="absolute inset-0 bg-purple-900/20 z-10 group-hover:bg-transparent transition-colors duration-500" />
                            {item.file?.data_base64 && item.file.content_type?.startsWith("image/") ? (
                                <img
                                    src={`data:${item.file.content_type};base64,${item.file.data_base64}`}
                                    alt={item.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                            ) : item.file?.data_base64 && item.file.content_type?.startsWith("video/") ? (
                                <video
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                >
                                    <source
                                        src={`data:${item.file.content_type};base64,${item.file.data_base64}`}
                                        type={item.file.content_type}
                                    />
                                </video>
                            ) : (
                                <img
                                    src={`https://picsum.photos/seed/${item.content_piece_id}/1200/800`}
                                    alt={item.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                            )}
                            <div className="absolute top-3 left-3 z-20">
                                <span className="px-3 py-1 bg-white/85 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-800 border border-purple-500/30">
                                    {item.content_format}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-lg font-bold text-purple-900 mb-2 group-hover:text-white transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                                {item.description || "No description"}
                            </p>

                            <div className="mt-auto pt-4 border-t border-purple-500/10 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs text-purple-400">
                                    <FileStack className="w-3 h-3" />
                                    <span>{item.path || item.content_piece_id}</span>
                                </div>
                                <button
                                    onClick={() => onViewContent(item.content_piece_id)}
                                    className="text-xs font-bold text-purple-700 hover:text-purple-300 transition-colors"
                                >
                                    VIEW CONTENT →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </motion.div >
    );
}
