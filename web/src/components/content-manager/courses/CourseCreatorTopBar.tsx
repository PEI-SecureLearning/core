import { ArrowLeft, Eye, Loader2 } from 'lucide-react'

interface CourseCreatorTopBarProps {
    readonly title: string
    readonly onBack: () => void
    readonly onPreview: () => void
    readonly canPreview: boolean
    readonly onPublish: () => void
    readonly isSaving?: boolean
}

export function CourseCreatorTopBar({
    title,
    onBack,
    onPreview,
    canPreview,
    onPublish,
    isSaving = false,
}: CourseCreatorTopBarProps) {
    return (
        <div className="flex items-center justify-between px-6 py-3 bg-surface border-b border-border shadow-sm flex-shrink-0">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent-secondary transition-colors flex-shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="h-5 w-px bg-border flex-shrink-0" />

                <h1 className="text-lg font-bold text-foreground truncate">
                    {title || 'Untitled Course'}
                </h1>
            </div>

            <div className="flex flex-row items-center gap-2">
                <button
                    type="button"
                    onClick={onPreview}
                    disabled={!canPreview}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${canPreview
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90'
                        : 'bg-surface-subtle text-muted-foreground cursor-not-allowed'
                        }`}
                >
                    <Eye className="w-4 h-4" />
                    Preview
                </button>
                <button
                    type="button"
                    onClick={onPublish}
                    disabled={isSaving}
                    style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm shadow-[#7C3AED]/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSaving ? 'Publishing...' : 'Publish'}
                </button>

            </div>
        </div>
    )
}
