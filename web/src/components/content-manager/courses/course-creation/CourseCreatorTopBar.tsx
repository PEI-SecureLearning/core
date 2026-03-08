import { ArrowLeft, Eye } from 'lucide-react'

interface CourseCreatorTopBarProps {
    readonly title: string
    readonly onTitleChange: (title: string) => void
    readonly onBack: () => void
    readonly onPreview: () => void
    readonly canPreview: boolean
}

export function CourseCreatorTopBar({
    title,
    onTitleChange,
    onBack,
    onPreview,
    canPreview,
}: CourseCreatorTopBarProps) {
    return (
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-purple-700 transition-colors flex-shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="h-5 w-px bg-slate-200 flex-shrink-0" />

                <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Untitled Course"
                    className="flex-1 text-lg font-bold text-slate-800 placeholder:text-slate-300 bg-transparent border-none outline-none focus:ring-0 min-w-0"
                />
            </div>

            <div className="flex flex-row items-center gap-2">
                <button
                    type="button"
                    onClick={onPreview}
                    disabled={!canPreview}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${canPreview
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    <Eye className="w-4 h-4" />
                    Preview
                </button>
                <button
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Publish
                </button>

            </div>
        </div>
    )
}
