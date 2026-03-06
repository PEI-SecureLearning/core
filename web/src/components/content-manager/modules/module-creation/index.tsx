import { useState, useCallback } from 'react'
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Loader2, X } from 'lucide-react'
import { publishModule } from '@/services/modulesApi'
import type { ModuleFormData } from './types'
import { ProgressBar } from './preview/ProgressBar'
import { DetailsSidebar } from './sidebar/DetailsSidebar'
import { SectionsEditor } from './SectionsEditor'
import { ModulePreview } from './preview/ModulePreview'
import { useAutoSave, type SaveStatus } from './useAutoSave'
import { calcCompletion } from './utils'
import { ConfirmProvider } from '@/components/ui/confirm-modal'

const INITIAL_DATA: ModuleFormData = {
    title: '',
    category: '',
    description: '',
    coverImage: '',
    coverImageId: '',
    estimatedTime: '',
    difficulty: 'Easy',
    sections: [],
    hasRefreshModule: false,
    refreshSections: [],
}

const STATUS_CLASSES: Record<string, string> = {
    pending: 'text-slate-400 bg-slate-50',
    saving:  'text-slate-500 bg-slate-100',
    saved:   'text-green-600 bg-green-50',
    error:   'text-red-600 bg-red-50',
}

function SaveStatusPill({ status }: { readonly status: SaveStatus }) {
    if (status === 'idle') return null
    return (
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all ${STATUS_CLASSES[status] ?? ''}`}>
            {status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
            {status === 'saving'  && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === 'saved'   && <CheckCircle2 className="w-3 h-3" />}
            {status === 'error'   && <AlertCircle className="w-3 h-3" />}
            <span>
                {status === 'pending' && 'Unsaved changes'}
                {status === 'saving'  && 'Saving…'}
                {status === 'saved'   && 'Saved'}
                {status === 'error'   && 'Auto-save failed'}
            </span>
        </div>
    )
}

/** Inline leave-confirmation dialog with live saving-state on the Leave button. */
function LeaveConfirmDialog({
    saveStatus,
    onLeave,
    onCancel,
}: {
    readonly saveStatus: SaveStatus
    readonly onLeave: () => void
    readonly onCancel: () => void
}) {
    const isSaving = saveStatus === 'pending' || saveStatus === 'saving'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
                onClick={onCancel}
                aria-label="Close dialog"
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-start gap-4 p-6 pb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Leave module editor?
                        </h3>
                        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                            {isSaving
                                ? 'Auto-saving your changes — please wait a moment before leaving.'
                                : 'Your changes have been saved. You can safely leave.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 pt-4 bg-slate-50 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Keep editing
                    </button>
                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={onLeave}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSaving
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Auto-saving…</>
                            : 'Leave'}
                    </button>
                </div>
            </div>
        </div>
    )
}

interface ModuleCreationFormProps {
    /** A function that returns the current (possibly refreshed) Keycloak token. */
    getToken: () => string | undefined
    onSuccess?: (moduleId: string) => void
    onBack?: () => void
    /** Provide when editing an existing module (loaded from the API). */
    initialData?: ModuleFormData
    /** Provide when editing an existing module so auto-save PATCHes instead of POSTing. */
    initialModuleId?: string
}

function ModuleCreationFormInner({ getToken, onSuccess, onBack, initialData, initialModuleId }: Readonly<ModuleCreationFormProps>) {
    const isEditing = initialModuleId != null

    const [data, setData] = useState<ModuleFormData>(initialData ?? INITIAL_DATA)
    const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'error'>('idle')
    const [previewOpen, setPreviewOpen] = useState(false)
    const [waveActive, setWaveActive] = useState(0)
    const [publishAttempted, setPublishAttempted] = useState(false)
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

    const patch = useCallback((p: Partial<ModuleFormData>) => {
        setData(d => ({ ...d, ...p }))
    }, [])

    // Auto-save: creates draft on first keystroke, patches on every subsequent change
    const { saveStatus, moduleId, forceSave, forceSaveIfDirty } = useAutoSave(data, getToken, 15_000, initialModuleId)

    /** Open the leave dialog and immediately flush any pending auto-save
     *  so the user doesn't have to wait for the 15 s debounce to expire. */
    const handleBack = useCallback(() => {
        if (!onBack) return
        const hasContent = data.title.trim() !== '' || data.sections.length > 0
        if (!hasContent) { onBack(); return }
        // Kick off a save only if data was actually changed by the user;
        // the dialog's Leave button stays disabled until it completes.
        void forceSaveIfDirty()
        setLeaveDialogOpen(true)
    }, [onBack, data.title, data.sections.length, forceSaveIfDirty])

    /** Called by the Leave button inside the dialog — only reachable when not saving. */
    const handleLeaveConfirm = useCallback(() => {
        setLeaveDialogOpen(false)
        onBack?.()
    }, [onBack])

    /** Edit mode: just flush the latest changes and call onSuccess. */
    const handleSave = useCallback(async () => {
        if (!moduleId) return
        setActionStatus('loading')
        try {
            await forceSave()
            onSuccess?.(moduleId)
        } catch {
            setActionStatus('error')
        } finally {
            setActionStatus('idle')
        }
    }, [moduleId, forceSave, onSuccess])

    /** Create mode: validate completion, flush, then publish. */
    const handlePublish = useCallback(async () => {
        const pct = calcCompletion(data)
        if (pct < 100) {
            setPublishAttempted(true)
            setWaveActive(n => n + 1)
            return
        }
        if (!moduleId) return
        setActionStatus('loading')
        try {
            await forceSave()
            const published = await publishModule(moduleId, getToken())
            onSuccess?.(published.id)
        } catch {
            setActionStatus('error')
        }
    }, [moduleId, getToken, onSuccess, data, forceSave])

    const togglePreview = useCallback(() => setPreviewOpen(prev => !prev), [])

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 bg-white">
                {onBack && (
                    <>
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-700 transition-colors"
                            aria-label="Back to Modules"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Modules
                        </button>
                        <div className="h-5 w-px bg-slate-300" aria-hidden="true" />
                    </>
                )}
                <h1 className="text-2xl font-bold text-slate-900">
                    {isEditing ? 'Edit module' : 'Create module'}
                </h1>

                {/* Auto-save status */}
                <div className="ml-auto flex items-center gap-3">
                    <SaveStatusPill status={saveStatus} />

                    <button
                        type="button"
                        onClick={togglePreview}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors"
                    >
                        Preview
                    </button>

                    {isEditing ? (
                        <button
                            type="button"
                            disabled={actionStatus === 'loading'}
                            onClick={handleSave}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {actionStatus === 'loading'
                                ? <>Saving…</>
                                : <>Save</>
                            }
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={actionStatus === 'loading'}
                            onClick={handlePublish}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Publish
                            {actionStatus === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <ProgressBar data={data} waveActive={waveActive} />

            <div className="flex flex-row flex-1 overflow-hidden">
                <DetailsSidebar
                    data={data}
                    onChange={patch}
                    publishAttempted={publishAttempted}
                    getToken={getToken}
                />
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <SectionsEditor data={data} onChange={patch} publishAttempted={publishAttempted} getToken={getToken} />
                </div>
            </div>

            {previewOpen && (
                <ModulePreview data={data} onClose={togglePreview} />
            )}

            {/* Leave-confirmation dialog — Leave button tracks live saveStatus */}
            {leaveDialogOpen && (
                <LeaveConfirmDialog
                    saveStatus={saveStatus}
                    onLeave={handleLeaveConfirm}
                    onCancel={() => setLeaveDialogOpen(false)}
                />
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
