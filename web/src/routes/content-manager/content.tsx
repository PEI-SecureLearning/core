import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react'
import { Toolbar } from '@/components/content-manager/shared/ToolBar';
import { useKeycloak } from '@react-keycloak/web';
import { toast } from 'sonner';

export const Route = createFileRoute('/content-manager/content')({
    component: RouteComponent,
})

const transition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 40,
    mass: 1
}

import { ContentDisplay } from '@/components/content-manager/content/ContentDisplay';
import { ContentTitle } from '@/components/content-manager/content/ContentTitle';
import { ViewContentModal } from '@/components/content-manager/ViewContentModal';

const API_BASE = import.meta.env.VITE_API_URL;

function RouteComponent() {
    const { keycloak } = useKeycloak();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("title");
    const [refreshKey, setRefreshKey] = useState(0);
    const [viewingContentId, setViewingContentId] = useState<string | null>(null);

    const handleDeleteContent = async (contentPieceId: string) => {
        const confirmed = window.confirm("Delete this content piece?");
        if (!confirmed) return;

        try {
            const res = await fetch(
                `${API_BASE}/content/${encodeURIComponent(contentPieceId)}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                    },
                }
            );

            if (!res.ok) throw new Error("Failed to delete content");

            toast.success("Content deleted successfully.");
            setRefreshKey((prev) => prev + 1);
        } catch {
            toast.error("Could not delete content.");
        }
    };

    return (
        <motion.div
            layoutId="card-Content"
            transition={transition}
            className="w-full h-full py-4 px-6 bg-gray-50/50 flex flex-col relative"
        >
            <ContentDisplay
                searchQuery={searchQuery}
                sortBy={sortBy}
                refreshKey={refreshKey}
                onViewContent={(id) => setViewingContentId(id)}
                onDeleteContent={handleDeleteContent}
                onSearchChange={setSearchQuery}
                onSortChange={setSortBy}
                onContentCreated={() => setRefreshKey((prev) => prev + 1)}
            />

            <ViewContentModal
                contentPieceId={viewingContentId}
                onClose={() => setViewingContentId(null)}
                onDeleted={() => setRefreshKey((prev) => prev + 1)}
            />

            <motion.div
                layoutId="icon-Content"
                transition={transition}
            />
        </motion.div>
    )
}
