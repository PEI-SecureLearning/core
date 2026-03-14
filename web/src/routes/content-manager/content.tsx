import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { toast } from 'sonner';
import { ContentDisplay } from '@/components/content-manager/content/ContentDisplay';
import { ViewContentModal } from '@/components/content-manager/ViewContentModal';

const API_BASE = import.meta.env.VITE_API_URL;

export const Route = createFileRoute('/content-manager/content')({
    component: RouteComponent,
    validateSearch: (search: Record<string, unknown>) => ({
        addFile: search.addFile === 'true' || search.addFile === true,
    }),
})

function RouteComponent() {
    const { keycloak } = useKeycloak();
    const { addFile } = Route.useSearch()
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("title");
    const [refreshKey, setRefreshKey] = useState(0);
    const [viewingContentId, setViewingContentId] = useState<string | null>(null);
    const [startEditing, setStartEditing] = useState(false);

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
        <div className="w-full h-full py-4 px-6 bg-gray-50/50 flex flex-col relative">
            <ContentDisplay
                searchQuery={searchQuery}
                sortBy={sortBy}
                refreshKey={refreshKey}
                openNewModal={addFile}
                onViewContent={(id) => {
                    setStartEditing(false);
                    setViewingContentId(id);
                }}
                onEditContent={(id) => {
                    setStartEditing(true);
                    setViewingContentId(id);
                }}
                onDeleteContent={handleDeleteContent}
                onSearchChange={setSearchQuery}
                onSortChange={setSortBy}
                onContentCreated={() => setRefreshKey((prev) => prev + 1)}
            />

            <ViewContentModal
                contentPieceId={viewingContentId}
                startInEditMode={startEditing}
                onClose={() => {
                    setViewingContentId(null)
                    setStartEditing(false)
                }}
                onUpdated={() => setRefreshKey((prev) => prev + 1)}
            />
        </div>
    )
}
