import { Loader2 } from 'lucide-react'

export type SaveStatusState = 'idle' | 'saving' | 'saved' | 'error'

interface SaveStatusProps {
    readonly status: SaveStatusState
    readonly isDirty: boolean
}

export function SaveStatus({ status, isDirty }: SaveStatusProps) {
    return (
        <div className="flex items-center gap-2 mr-4">
            {status === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
            <span className="text-xs font-medium text-muted-foreground">
                {status === 'saving' ? 'Saving…' : (
                    isDirty ? 'Unsaved changes' : (
                        status === 'error' ? 'Save failed' : 'All changes saved'
                    )
                )}
            </span>
        </div>
    )
}
