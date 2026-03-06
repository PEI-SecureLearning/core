import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react';
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

const API_BASE = import.meta.env.VITE_API_URL;

function RouteComponent() {
    const { keycloak } = useKeycloak();
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("title");
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
    const [selectedContent, setSelectedContent] = useState<{
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
    } | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [protectedPreviewUrl, setProtectedPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const handleViewContent = async (contentPieceId: string) => {
        setSelectedContentId(contentPieceId);
        setLoadingDetails(true);
        try {
            const res = await fetch(`${API_BASE}/content/${encodeURIComponent(contentPieceId)}`, {
                headers: {
                    Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to load details");
            }

            const data = await res.json();
            setSelectedContent(data);
        } catch {
            toast.error("Could not load content details.");
            setSelectedContentId(null);
            setSelectedContent(null);
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeDetails = () => {
        setSelectedContentId(null);
        setSelectedContent(null);
        setProtectedPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    };

    const handleDeleteContent = async (contentPieceId: string) => {
        const confirmed = window.confirm("Delete this content piece?");
        if (!confirmed) {
            return;
        }

        setIsDeleting(true);
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

            if (!res.ok) {
                throw new Error("Failed to delete content");
            }

            toast.success("Content deleted successfully.");
            if (selectedContentId === contentPieceId) {
                closeDetails();
            }
            setRefreshKey((prev) => prev + 1);
        } catch {
            toast.error("Could not delete content.");
        } finally {
            setIsDeleting(false);
        }
    };

    const isImageFile = !!selectedContent?.file?.content_type?.startsWith("image/");
    const isVideoFile = !!selectedContent?.file?.content_type?.startsWith("video/");
    const inlineFileDataUrl =
        selectedContent?.file?.data_base64 && selectedContent.file.content_type
            ? `data:${selectedContent.file.content_type};base64,${selectedContent.file.data_base64}`
            : null;
    const previewFileUrl = inlineFileDataUrl || protectedPreviewUrl;

    useEffect(() => {
        const loadProtectedPreview = async () => {
            if (!selectedContent?.file || inlineFileDataUrl) {
                setProtectedPreviewUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return null;
                });
                return;
            }

            try {
                const res = await fetch(
                    `${API_BASE}/content/${encodeURIComponent(selectedContent.content_piece_id)}/file`,
                    {
                        headers: {
                            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                        },
                    }
                );
                if (!res.ok) {
                    throw new Error("Failed to load protected preview");
                }
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

        void loadProtectedPreview();

        return () => {
            setProtectedPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
    }, [selectedContent?.content_piece_id, selectedContent?.file, inlineFileDataUrl, keycloak.token]);

    return (

        <motion.div
            layoutId="card-Content"
            transition={transition}

            className="w-full h-full py-4 px-6 bg-gray-50/50 flex flex-col relative"
        >

            <div className='w-full h-[8%] flex flex-row relative z-10'>
                <ContentTitle />

                <div className='w-[70%] flex flex-row gap-4 justify-end'>
                    {!selectedContentId && (
                        <Toolbar
                            searchPlaceholder="Search content..."
                            searchValue={searchQuery}
                            onSearchChange={setSearchQuery}
                            sortValue={sortBy}
                            onSortChange={setSortBy}
                            newType="Content"
                        />
                    )}
                </div>
            </div>

            <div className={`w-full h-[92%] rounded-lg p-10 relative overflow-y-auto transition-colors duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] 
        ${isLoaded ? 'bg-gray-100' : 'bg-purple-500/50'} z-10 border-1 border-gray-200`}
            >
                {!selectedContentId && (
                    <ContentDisplay
                        searchQuery={searchQuery}
                        sortBy={sortBy}
                        refreshKey={refreshKey}
                        onViewContent={handleViewContent}
                        onDeleteContent={handleDeleteContent}
                    />
                )}

                {selectedContentId && (
                    <div className="space-y-6">
                        <button
                            onClick={closeDetails}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to content list
                        </button>

                        {loadingDetails && <p className="text-sm text-gray-600">Fetching content details...</p>}

                        {!loadingDetails && selectedContent && (
                            <section className="rounded-2xl bg-white border border-purple-500/20 p-6 shadow-sm space-y-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-purple-900">{selectedContent.title}</h2>
                                        <p className="text-sm text-gray-500 mt-1">{selectedContent.content_piece_id}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 uppercase">
                                            {selectedContent.content_format}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={isDeleting}
                                            onClick={() => handleDeleteContent(selectedContent.content_piece_id)}
                                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                                        >
                                            {isDeleting ? "Deleting..." : "Delete"}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                                    <div><span className="font-semibold text-gray-900">Kind:</span> {selectedContent.kind}</div>
                                    <div><span className="font-semibold text-gray-900">Format:</span> {selectedContent.content_format}</div>
                                    <div className="md:col-span-2 break-all"><span className="font-semibold text-gray-900">Path:</span> {selectedContent.path}</div>
                                    <div><span className="font-semibold text-gray-900">Created:</span> {new Date(selectedContent.created_at).toLocaleString()}</div>
                                    <div><span className="font-semibold text-gray-900">Updated:</span> {new Date(selectedContent.updated_at).toLocaleString()}</div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                                    <p className="text-sm text-gray-700">{selectedContent.description || "No description."}</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Body</h3>
                                    <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
                                        {selectedContent.body || "No text body."}
                                    </pre>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Source URL</h3>
                                    {selectedContent.source_url ? (
                                        <a
                                            href={selectedContent.source_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-purple-700 hover:text-purple-900 underline break-all"
                                        >
                                            {selectedContent.source_url}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-gray-700">No source URL.</p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">File</h3>
                                    {selectedContent.file ? (
                                        <div className="space-y-1 text-sm text-gray-700">
                                            <p><span className="font-medium text-gray-900">Name:</span> {selectedContent.file.filename}</p>
                                            <p><span className="font-medium text-gray-900">Type:</span> {selectedContent.file.content_type}</p>
                                            <p><span className="font-medium text-gray-900">Size:</span> {selectedContent.file.size} bytes</p>

                                            {previewFileUrl && isImageFile && (
                                                <div className="pt-3">
                                                    <p className="font-medium text-gray-900 mb-2">Preview</p>
                                                    <img
                                                        src={previewFileUrl}
                                                        alt={selectedContent.file.filename}
                                                        className="max-h-96 w-auto rounded-lg border border-gray-200"
                                                    />
                                                </div>
                                            )}

                                            {previewFileUrl && isVideoFile && (
                                                <div className="pt-3">
                                                    <p className="font-medium text-gray-900 mb-2">Preview</p>
                                                    <video
                                                        controls
                                                        className="max-h-96 w-full rounded-lg border border-gray-200 bg-black"
                                                    >
                                                        <source src={previewFileUrl} type={selectedContent.file.content_type} />
                                                        Your browser does not support the video element.
                                                    </video>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700">No file attached.</p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Tags</h3>
                                    {selectedContent.tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedContent.tags.map((tag) => (
                                                <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-700">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700">No tags.</p>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                )}

            </div>

            <motion.div
                layoutId="icon-Content"
                transition={transition}
            />

        </motion.div>

    )
}
