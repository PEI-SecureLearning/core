import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmOptions {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
    const context = useContext(ConfirmContext)
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider')
    }
    return context.confirm
}

interface ConfirmState extends ConfirmOptions {
    resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({ ...options, resolve })
        })
    }, [])

    const handleConfirm = () => {
        confirmState?.resolve(true)
        setConfirmState(null)
    }

    const handleCancel = () => {
        confirmState?.resolve(false)
        setConfirmState(null)
    }

    const getVariantStyles = () => {
        switch (confirmState?.variant) {
            case 'danger':
                return {
                    icon: 'bg-red-100 text-red-600',
                    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }
            case 'warning':
                return {
                    icon: 'bg-amber-100 text-amber-600',
                    button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                }
            default:
                return {
                    icon: 'bg-blue-100 text-blue-600',
                    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }
        }
    }

    const styles = getVariantStyles()

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Modal Overlay */}
            {confirmState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleCancel}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-start gap-4 p-6 pb-4">
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${styles.icon}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {confirmState.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                                    {confirmState.message}
                                </p>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 p-6 pt-4 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                            >
                                {confirmState.cancelText || 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.button}`}
                            >
                                {confirmState.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    )
}
