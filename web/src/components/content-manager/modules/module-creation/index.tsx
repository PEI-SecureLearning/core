import { useState, useCallback, useEffect } from 'react'
import { ArrowLeft, Eye, Loader2, Upload } from 'lucide-react'
import { createModule, updateModule } from '@/services/modulesApi'
import { toast } from 'sonner'
import type { ModuleFormData } from './types'
import { ProgressBar } from './preview/ProgressBar'
import { DetailsSidebar } from './sidebar/DetailsSidebar'
import { SectionsEditor } from './SectionsEditor'
import { ModulePreview } from './preview/ModulePreview'
import { StorageModal } from './StorageModal'
import { ValidationModal } from './ValidationModal'
import { uid } from './constants'
import { calcCompletion, getMissingFields, buildPayload } from './utils'
import { ConfirmProvider } from '@/components/ui/confirm-modal'
import { SaveStatus, type SaveStatusState } from './SaveStatus'
import { LeaveConfirm } from './LeaveConfirm'

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

export interface ModuleCreationFormProps {
    /** A function that returns the current (possibly refreshed) Keycloak token. */
    getToken: () => string | undefined
    onSuccess?: (moduleId: string) => void
    onBack?: () => void
    /** Provide when editing an existing module (loaded from the API). */
    initialData?: ModuleFormData
    /** Provide when editing an existing module so auto-save PATCHes instead of POSTing. */
    initialModuleId?: string
    /** Whether to open the preview modal immediately. */
    initialPreview?: boolean
}

function ModuleCreationFormInner({ getToken, onBack, initialData, initialModuleId, initialPreview }: Readonly<Omit<ModuleCreationFormProps, 'onSuccess'>>) {
    const isEditing = initialModuleId != null

    const [data, setData] = useState<ModuleFormData>(initialData ?? INITIAL_DATA)
    const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'error'>('idle')
    const [saveStatus, setSaveStatus] = useState<SaveStatusState>('idle')
    const [moduleId, setModuleId] = useState<string | null>(initialModuleId ?? null)
    const [previewOpen, setPreviewOpen] = useState(initialPreview ?? false)
    const [storageModalOpen, setStorageModalOpen] = useState(false)
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [showValidation, setShowValidation] = useState(false)
    const [publishAttempted, setPublishAttempted] = useState(false)

    const patch: (patch: Partial<ModuleFormData>, silent?: boolean) => void = useCallback((p, silent = false) => {
        setData(d => ({ ...d, ...p }))
        if (!silent) {
            setSaveStatus('idle')
            setIsDirty(true)
        }
    }, [])

    // Browser navigation guard
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [isDirty])

    const handleBack = useCallback(() => {
        if (!onBack) return
        if (isDirty) {
            setLeaveDialogOpen(true)
        } else {
            onBack()
        }
    }, [onBack, isDirty])

    const saveInternal = useCallback(async () => {
        const token = getToken()
        const payload = buildPayload(data)

        setSaveStatus('saving')
        try {
            let result
            if (moduleId) {
                result = await updateModule(moduleId, payload, token)
            } else {
                result = await createModule(payload, token)
                setModuleId(result.id)
            }
            setSaveStatus('saved')
            setIsDirty(false)
            return result.id
        } catch (err) {
            setSaveStatus('error')
            toast.error(err instanceof Error ? err.message : 'Failed to save module')
            throw err
        }
    }, [data, moduleId, getToken])

    const handleSaveAndLeave = useCallback(async () => {
        const pct = calcCompletion(data)
        if (pct < 100) {
            setPublishAttempted(true)
            setShowValidation(true)
            setLeaveDialogOpen(false)
            return
        }

        setActionStatus('loading')
        try {
            await saveInternal()
            toast.success(moduleId ? 'Module updated successfully' : 'Module created successfully')
            setLeaveDialogOpen(false)
            onBack?.()
        } catch {
            setActionStatus('error')
        } finally {
            setActionStatus('idle')
        }
    }, [saveInternal, onBack, moduleId, data])

    const handleDiscardAndLeave = useCallback(() => {
        setLeaveDialogOpen(false)
        onBack?.()
    }, [onBack])

    /** Save the module (create or update). */
    const handleSave = useCallback(async () => {
        const pct = calcCompletion(data)
        if (pct < 100) {
            setPublishAttempted(true)
            setShowValidation(true)
            return
        }

        setActionStatus('loading')
        try {
            await saveInternal()
            toast.success(moduleId ? 'Module updated successfully' : 'Module created successfully')
        } catch {
            setActionStatus('error')
        } finally {
            setActionStatus('idle')
        }
    }, [moduleId, saveInternal, data])

    const togglePreview = useCallback(() => setPreviewOpen(prev => !prev), [])

    const handleImport = (imported: ModuleFormData) => {
        const sanitizeBlock = (b: any): any => {
            if (!b || typeof b !== 'object') return null
            if (b.kind === 'question') {
                const q = b.question ?? {}
                return {
                    ...b,
                    id: b.id || uid(),
                    question: {
                        ...q,
                        id: q.id || uid(),
                        type: q.type || 'multiple_choice',
                        text: q.text || '',
                        answer: q.answer || '',
                        choices: Array.isArray(q.choices) ? q.choices.map((c: any) => ({
                            ...c,
                            id: c.id || uid(),
                            text: c.text || '',
                            isCorrect: !!c.isCorrect
                        })) : []
                    }
                }
            }
            return { ...b, id: b.id || uid() }
        }

        const sanitizeSection = (s: any): any => {
            if (!s || typeof s !== 'object') return null
            return {
                ...s,
                id: s.id || uid(),
                title: s.title || '',
                blocks: (Array.isArray(s.blocks) ? s.blocks : []).map(sanitizeBlock).filter(Boolean)
            }
        }

        const merged: ModuleFormData = {
            ...INITIAL_DATA,
            ...imported,
            sections: (Array.isArray(imported.sections) ? imported.sections : []).map(sanitizeSection).filter(Boolean),
            refreshSections: (Array.isArray(imported.refreshSections) ? imported.refreshSections : []).map(sanitizeSection).filter(Boolean),
        }
        setData(merged)
        setIsDirty(true)
        setStorageModalOpen(false)
        toast.success('Module metadata imported and sanitized')
    }

    return (
        <div className="fixed inset-0 bg-surface-subtle flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface">
                {onBack && (
                    <>
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            aria-label="Back to Modules"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Modules
                        </button>
                        <div className="h-5 w-px bg-border" aria-hidden="true" />
                    </>
                )}
                <h1 className="text-2xl font-bold text-foreground">
                    {isEditing ? 'Edit module' : 'Create module'}
                </h1>

                {/* Status indicator */}
                <div className="ml-auto flex items-center gap-3">
                    <SaveStatus status={saveStatus} isDirty={isDirty} />

                    <button
                        type="button"
                        onClick={() => setStorageModalOpen(true)}
                        title="Import / Export JSON"
                        className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors"
                    >
                        <Upload className="w-4.5 h-4.5" />
                    </button>

                    <button
                        type="button"
                        onClick={togglePreview}
                        title="Preview Module"
                        className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors"
                    >
                        <Eye className="w-4.5 h-4.5" />
                    </button>

                    <button
                        type="button"
                        disabled={actionStatus === 'loading'}
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Save
                        {(actionStatus === 'loading' || saveStatus === 'saving') && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <ProgressBar data={data} />

            <div className="flex flex-row flex-1 overflow-hidden">
                <DetailsSidebar
                    data={data}
                    onChange={patch}
                    publishAttempted={publishAttempted}
                    getToken={getToken}
                />
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <SectionsEditor
                        data={data}
                        onChange={patch}
                        publishAttempted={publishAttempted}
                        getToken={getToken}
                    />
                </div>
            </div>


            {previewOpen && (
                <ModulePreview data={data} onClose={togglePreview} />
            )}

            <ValidationModal
                isOpen={showValidation}
                onClose={() => setShowValidation(false)}
                missingFields={getMissingFields(data)}
            />

            <StorageModal
                isOpen={storageModalOpen}
                onClose={() => setStorageModalOpen(false)}
                onImport={handleImport}
                data={data}
            />

            {/* Leave-confirmation dialog — Save/Discard/Cancel options */}
            {leaveDialogOpen && (
                <LeaveConfirm
                    isSaving={actionStatus === 'loading'}
                    onSave={handleSaveAndLeave}
                    onDiscard={handleDiscardAndLeave}
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
