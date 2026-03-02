import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useKeycloak } from '@react-keycloak/web'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/content-manager/content_/new')({
    component: RouteComponent,
})

const API_BASE = import.meta.env.VITE_API_URL

function RouteComponent() {
    const navigate = useNavigate()
    const { keycloak } = useKeycloak()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [path, setPath] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [mode, setMode] = useState<'file' | 'text'>('file')
    const [contentFormat, setContentFormat] = useState<'text' | 'markdown' | 'html' | 'link'>('text')
    const [body, setBody] = useState('')
    const [sourceUrl, setSourceUrl] = useState('')
    const [tagsInput, setTagsInput] = useState('')
    const [file, setFile] = useState<File | null>(null)

    const normalizeContentPath = (rawPath: string) => {
        const trimmed = rawPath.trim().replace(/^\/+/, '')
        if (!trimmed) return 'content/'
        if (trimmed === 'content' || trimmed === 'content/') return 'content/'
        return trimmed.startsWith('content/') ? trimmed : `content/${trimmed}`
    }

    const parseTags = (input: string) =>
        input
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)

    const getCreateValidationError = () => {
        if (!path.trim()) return 'Path is required.'
        if (!title.trim()) return 'Title is required.'

        if (mode === 'file') {
            if (!file) return 'Select a file to upload.'
            return null
        }

        if (contentFormat === 'link' && !sourceUrl.trim()) {
            return 'Source URL is required for link content.'
        }

        if (contentFormat !== 'link' && !body.trim()) {
            return 'Body is required for text/markdown/html content.'
        }

        return null
    }

    const createFileContent = async (normalizedPath: string, parsedTags: string[], selectedFile: File) => {
        const formData = new FormData()
        formData.append('path', normalizedPath)
        formData.append('title', title)
        formData.append('description', description)
        formData.append('tags', parsedTags.join(','))
        formData.append('file', selectedFile)

        const res = await fetch(`${API_BASE}/content/upload`, {
            method: 'POST',
            headers: {
                Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '',
            },
            body: formData,
        })

        if (!res.ok) throw new Error('Upload failed')
    }

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
        })

        if (!res.ok) throw new Error('Content creation failed')
    }

    const submitContent = async () => {
        const parsedTags = parseTags(tagsInput)
        const normalizedPath = normalizeContentPath(path)

        if (mode === 'file' && file) {
            await createFileContent(normalizedPath, parsedTags, file)
            return
        }

        await createTextContent(normalizedPath, parsedTags)
    }

    const handleCreateContent = async (event: React.FormEvent) => {
        event.preventDefault()
        const validationError = getCreateValidationError()
        if (validationError) {
            toast.error(validationError)
            return
        }

        setIsSubmitting(true)
        try {
            await submitContent()
            toast.success('Content created successfully.')
            navigate({ to: '/content-manager/content' }).catch(() => undefined)
        } catch {
            toast.error('Could not create content.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="w-full h-full py-4 px-6 bg-gray-50/50 flex flex-col relative">
            <div className="w-full h-[8%] flex items-center relative z-10">
                <button
                    onClick={() => navigate({ to: '/content-manager/content' })}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to content list
                </button>
            </div>

            <div className="w-full h-[92%] rounded-lg p-10 overflow-y-auto bg-gray-100 border border-gray-200">
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
                            onChange={(e) => setMode(e.target.value as 'file' | 'text')}
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

                        {mode === 'file' ? (
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                            />
                        ) : (
                            <div className="space-y-3">
                                <select
                                    value={contentFormat}
                                    onChange={(e) => setContentFormat(e.target.value as 'text' | 'markdown' | 'html' | 'link')}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                                >
                                    <option value="text">Text</option>
                                    <option value="markdown">Markdown</option>
                                    <option value="html">HTML</option>
                                    <option value="link">Link</option>
                                </select>

                                {contentFormat === 'link' ? (
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
                                onClick={() => navigate({ to: '/content-manager/content' })}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                            >
                                {isSubmitting ? 'Saving...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    )
}
