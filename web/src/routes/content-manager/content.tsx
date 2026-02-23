import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react';
import { Toolbar } from '@/components/content-manager/ToolBar';
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

import { ContentDisplay } from '@/components/content-manager/ContentDisplay';
import { ContentTitle } from '@/components/content-manager/ContentTitle';

const API_BASE = import.meta.env.VITE_API_URL;

function RouteComponent() {
    const { keycloak } = useKeycloak();
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("title");
    const [refreshKey, setRefreshKey] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [path, setPath] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [mode, setMode] = useState<"file" | "text">("file");
    const [contentFormat, setContentFormat] = useState<"text" | "markdown" | "html" | "link">("text");
    const [body, setBody] = useState("");
    const [sourceUrl, setSourceUrl] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [file, setFile] = useState<File | null>(null);
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
        file: { filename: string; content_type: string; size: number; data_base64?: string | null } | null;
        created_at: string;
        updated_at: string;
    } | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const normalizeContentPath = (rawPath: string) => {
        const trimmed = rawPath.trim().replace(/^\/+/, "");
        if (!trimmed) return "content/";
        if (trimmed === "content" || trimmed === "content/") return "content/";
        return trimmed.startsWith("content/") ? trimmed : `content/${trimmed}`;
    };

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const resetModal = () => {
        setPath("");
        setTitle("");
        setDescription("");
        setMode("file");
        setContentFormat("text");
        setBody("");
        setSourceUrl("");
        setTagsInput("");
        setFile(null);
        setShowAddModal(false);
    };

    const handleCreateContent = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!path.trim()) {
            toast.error("Path is required.");
            return;
        }

        if (!title.trim()) {
            toast.error("Title is required.");
            return;
        }

        if (mode === "file" && !file) {
            toast.error("Select a file to upload.");
            return;
        }

        if (mode === "text") {
            if (contentFormat === "link" && !sourceUrl.trim()) {
                toast.error("Source URL is required for link content.");
                return;
            }
            if (contentFormat !== "link" && !body.trim()) {
                toast.error("Body is required for text/markdown/html content.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const parsedTags = tagsInput
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0);

            const normalizedPath = normalizeContentPath(path);

            if (mode === "file" && file) {
                const formData = new FormData();
                formData.append("path", normalizedPath);
                formData.append("title", title);
                formData.append("description", description);
                formData.append("tags", parsedTags.join(","));
                formData.append("file", file);

                const res = await fetch(`${API_BASE}/content/upload`, {
                    method: "POST",
                    headers: {
                        Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                    },
                    body: formData,
                });

                if (!res.ok) {
                    throw new Error("Upload failed");
                }
            } else {
                const res = await fetch(`${API_BASE}/content`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                    },
                    body: JSON.stringify({
                        path: normalizedPath,
                        title,
                        description: description || null,
                        content_format: contentFormat,
                        body: contentFormat === "link" ? null : body,
                        source_url: contentFormat === "link" ? sourceUrl : null,
                        tags: parsedTags,
                    }),
                });

                if (!res.ok) {
                    throw new Error("Content creation failed");
                }
            }

            toast.success("Content created successfully.");
            resetModal();
            setRefreshKey((prev) => prev + 1);
        } catch {
            toast.error("Could not create content.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
    };

    const isImageFile = !!selectedContent?.file?.content_type?.startsWith("image/");
    const isVideoFile = !!selectedContent?.file?.content_type?.startsWith("video/");
    const fileDataUrl =
        selectedContent?.file?.data_base64 && selectedContent.file.content_type
            ? `data:${selectedContent.file.content_type};base64,${selectedContent.file.data_base64}`
            : null;

    return (

        <motion.div
            layoutId="card-Content"
            transition={transition}

            className="w-full h-full py-4 px-6 bg-gray-50/50 flex flex-col relative"
        >

            <div className='w-full h-[8%] flex flex-row relative z-10'>
                <ContentTitle />

                <div className='w-[70%] flex flex-row gap-4 justify-end'>
                    {!selectedContentId && !showAddModal && (
                        <Toolbar
                            searchPlaceholder="Search content..."
                            searchValue={searchQuery}
                            onSearchChange={setSearchQuery}
                            sortValue={sortBy}
                            onSortChange={setSortBy}
                            onAddClick={() => setShowAddModal(true)}
                        />
                    )}
                </div>
            </div>

            <div className={`w-full h-[92%] rounded-lg p-10 relative overflow-y-auto transition-colors duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] 
        ${isLoaded ? 'bg-gray-100' : 'bg-purple-500/50'} z-10 border-1 border-gray-200`}
            >
                {!selectedContentId && !showAddModal && (
                    <ContentDisplay
                        searchQuery={searchQuery}
                        sortBy={sortBy}
                        refreshKey={refreshKey}
                        onViewContent={handleViewContent}
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
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 uppercase">
                                        {selectedContent.content_format}
                                    </span>
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

                                            {fileDataUrl && isImageFile && (
                                                <div className="pt-3">
                                                    <p className="font-medium text-gray-900 mb-2">Preview</p>
                                                    <img
                                                        src={fileDataUrl}
                                                        alt={selectedContent.file.filename}
                                                        className="max-h-96 w-auto rounded-lg border border-gray-200"
                                                    />
                                                </div>
                                            )}

                                            {fileDataUrl && isVideoFile && (
                                                <div className="pt-3">
                                                    <p className="font-medium text-gray-900 mb-2">Preview</p>
                                                    <video
                                                        controls
                                                        className="max-h-96 w-full rounded-lg border border-gray-200 bg-black"
                                                    >
                                                        <source src={fileDataUrl} type={selectedContent.file.content_type} />
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

                {showAddModal && (
                    <div className="space-y-6">
                        <button
                            onClick={resetModal}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to content list
                        </button>

                        <section className="rounded-2xl bg-white border border-purple-500/20 p-6 shadow-sm space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">Add New Content</h2>
                            <form onSubmit={handleCreateContent} className="space-y-3">
                                <input
                                    value={path}
                                    onChange={(e) => setPath(e.target.value)}
                                    placeholder="Path (e.g. courses/security/module-1/content-1)"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                                />
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Title"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                                />
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Description (optional)"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                                />
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as "file" | "text")}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                                >
                                    <option value="file">Upload file</option>
                                    <option value="text">Write text</option>
                                </select>

                                <input
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    placeholder="Tags (comma separated)"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                                />

                                {mode === "file" ? (
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        <select
                                            value={contentFormat}
                                            onChange={(e) =>
                                                setContentFormat(e.target.value as "text" | "markdown" | "html" | "link")
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                                        >
                                            <option value="text">Text</option>
                                            <option value="markdown">Markdown</option>
                                            <option value="html">HTML</option>
                                            <option value="link">Link</option>
                                        </select>

                                        {contentFormat === "link" ? (
                                            <input
                                                value={sourceUrl}
                                                onChange={(e) => setSourceUrl(e.target.value)}
                                                placeholder="Source URL"
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                                            />
                                        ) : (
                                            <textarea
                                                value={body}
                                                onChange={(e) => setBody(e.target.value)}
                                                placeholder="Body content"
                                                className="w-full min-h-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                                            />
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={resetModal}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                                    >
                                        {isSubmitting ? "Saving..." : "Create"}
                                    </button>
                                </div>
                            </form>
                        </section>
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
