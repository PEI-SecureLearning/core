import { AlertTriangle, Loader2 } from 'lucide-react'

interface LeaveConfirmProps {
    readonly onSave: () => Promise<void>
    readonly onDiscard: () => void
    readonly onCancel: () => void
    readonly isSaving: boolean
}

export function LeaveConfirm({
    onSave,
    onDiscard,
    onCancel,
    isSaving,
}: LeaveConfirmProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />

            {/* Modal */}
            <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-border">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">
                            Unsaved Changes
                        </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        You have unsaved changes. Do you want to save them before leaving?
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-4 bg-surface-subtle border-t border-border">
                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={onCancel}
                        className="w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg transition-colors border border-transparent hover:border-border"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={onDiscard}
                        className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-surface border border-border rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={onSave}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors disabled:opacity-50 shadow-sm shadow-primary/20"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Exit'}
                    </button>
                </div>
            </div>
        </div>
    )
}
