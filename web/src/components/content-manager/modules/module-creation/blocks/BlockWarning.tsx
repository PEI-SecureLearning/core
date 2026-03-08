import { AlertTriangle } from 'lucide-react'

export function BlockWarning({ message }: { readonly message: string }) {
    return (
        <div className="flex items-start gap-2 mx-4 mb-3 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{message}</span>
        </div>
    )
}
