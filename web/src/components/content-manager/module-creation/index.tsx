import { useState, useCallback } from 'react'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { publishModule } from '@/services/modulesApi'
import type { ModuleFormData } from './types'
import { ProgressBar } from './ProgressBar'
import { DetailsSidebar } from './DetailsSidebar'
import { SectionsEditor } from './SectionsEditor'
import { ModulePreview } from './ModulePreview'
import { useAutoSave, type SaveStatus } from './useAutoSave'
import { calcCompletion } from './utils'
import { ConfirmProvider, useConfirm } from '@/components/ui/confirm-modal'

const INITIAL_DATA: ModuleFormData = {
    title: '',
    category: '',
    description: '',
    coverImage: '',
    estimatedTime: '',
    difficulty: 'Easy',
    sections: [],
}

const STATUS_CLASSES: Record<string, string> = {
    saving: 'text-slate-500 bg-slate-100',
    saved:  'text-green-600 bg-green-50',
    error:  'text-red-600 bg-red-50',
}

function SaveStatusPill({ status }: { readonly status: SaveStatus }) {
    if (status === 'idle') return null
    return (
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all ${STATUS_CLASSES[status] ?? ''}`}>
            {status === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === 'saved'  && <CheckCircle2 className="w-3 h-3" />}
            {status === 'error'  && <AlertCircle className="w-3 h-3" />}
            <span>
                {status === 'saving' && 'Saving…'}
                {status === 'saved'  && 'Saved'}
                {status === 'error'  && 'Auto-save failed'}
            </span>
        </div>
    )
}

interface ModuleCreationFormProps {
    token?: string
    onSuccess?: (moduleId: string) => void
    onBack?: () => void
}

function ModuleCreationFormInner({ token, onSuccess, onBack }: Readonly<ModuleCreationFormProps>) {
    const confirm = useConfirm()

    const [data, setData]             = useState<ModuleFormData>(INITIAL_DATA)
    const [publishStatus, setPublishStatus] = useState<'idle' | 'loading' | 'error'>('idle')
    const [previewOpen, setPreviewOpen]     = useState(false)
    const [waveActive, setWaveActive]       = useState(0)
    const [publishAttempted, setPublishAttempted] = useState(false)

    const patch = useCallback((p: Partial<ModuleFormData>) => {
        setData(d => ({ ...d, ...p }))
    }, [])

    // Auto-save: creates draft on first keystroke, patches on every subsequent change
    const { saveStatus, moduleId } = useAutoSave(data, token)

    const handleBack = useCallback(async () => {
        if (!onBack) return
        const hasContent = data.title.trim() !== '' || data.sections.length > 0
        if (!hasContent) { onBack(); return }
        const ok = await confirm({
            title:       'Leave module creator?',
            message:     'Your draft has been auto-saved. You can return to continue editing at any time.',
            confirmText: 'Leave',
            cancelText:  'Keep editing',
            variant:     'warning',
        })
        if (ok) onBack()
    }, [confirm, onBack, data.title, data.sections.length])

    const handlePublish = useCallback(async () => {
        const pct = calcCompletion(data)
        if (pct < 100) {
            setPublishAttempted(true)
            setWaveActive(n => n + 1)   // increment so every press fires a new effect
            return
        }
        if (!moduleId) return
        setPublishStatus('loading')
        try {
            const published = await publishModule(moduleId, token)
            onSuccess?.(published.id)
        } catch {
            setPublishStatus('error')
        }
    }, [moduleId, token, onSuccess, data])

    const togglePreview = useCallback(() => setPreviewOpen(prev => !prev), [])

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 bg-white">
                {onBack && (
                    <>
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-700 transition-colors"
                            aria-label="Back to Modules"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Modules
                        </button>
                        <div className="h-5 w-px bg-slate-300" aria-hidden="true" />
                    </>
                )}                <h1 className="text-2xl font-bold text-slate-900">Module creator</h1>

                {/* Auto-save status */}
                <div className="ml-auto flex items-center gap-3">
                    <SaveStatusPill status={saveStatus} />

                    <button
                        type="button"
                        disabled={publishStatus === 'loading'}
                        onClick={handlePublish}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {publishStatus === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Publish
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <ProgressBar data={data} waveActive={waveActive} />

            <div className="flex flex-row flex-1 overflow-hidden">
                <DetailsSidebar
                    data={data}
                    onChange={patch}
                    onPreview={togglePreview}
                    publishAttempted={publishAttempted}
                />
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <SectionsEditor data={data} onChange={patch} publishAttempted={publishAttempted} />
                </div>
            </div>

            {previewOpen && (
                <ModulePreview data={data} onClose={togglePreview} />
            )}
        </div>
    )
}

export function ModuleCreationForm(props: Readonly<ModuleCreationFormProps>) {
    return (
        <ConfirmProvider>
            <ModuleCreationFormInner {...props} />
        </ConfirmProvider>
    )
}