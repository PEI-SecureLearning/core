import { Button } from '@/components/ui/button'
import { Rocket } from 'lucide-react'
import { PreviewPanelHeader } from './PreviewPanelHeader'
import { PreviewPanelLogo } from './PreviewPanelLogo'
import { PreviewPanelDetails } from './PreviewPanelDetails'

interface PreviewPanelProps {
    realmName: string
    features: { phishing: boolean; lms: boolean }
    isLoading: boolean
    handleSubmit: (e: React.FormEvent) => void
}

export function PreviewPanel({
    realmName,
    features,
    isLoading,
    handleSubmit
}: PreviewPanelProps) {
    return (
        <div className="w-80 flex flex-col gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-100/50 overflow-hidden shadow-xl shadow-purple-100/30">
                <PreviewPanelHeader />
                <PreviewPanelLogo />
                <PreviewPanelDetails
                    realmName={realmName}
                    features={features}
                />

                <div className="px-6 pb-6">
                    <div className="flex items-center gap-2 text-purple-600 text-xs bg-purple-50/50 p-3 rounded-xl">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                            !
                        </div>
                        <span>Fill the form to see live preview</span>
                    </div>
                </div>
            </div>

            <Button
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-14 text-lg font-semibold rounded-2xl shadow-xl shadow-purple-200/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleSubmit}
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Rocket className="w-5 h-5" />
                        Create Tenant
                    </span>
                )}
            </Button>
        </div>
    )
}
