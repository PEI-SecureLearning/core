import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import { PreviewPanelHeader } from './PreviewPanelHeader'
import { PreviewPanelLogo } from './PreviewPanelLogo'
import { PreviewPanelDetails } from './PreviewPanelDetails'

interface PreviewPanelProps {
    realmName: string
    bundle: string
    features: { phishing: boolean; lms: boolean }
    isLoading: boolean
    handleSubmit: (e: React.FormEvent) => void
}

export function PreviewPanel({
    realmName,
    bundle,
    features,
    isLoading,
    handleSubmit
}: PreviewPanelProps) {
    return (
        <div className="w-80 flex flex-col gap-4">
            <div className="bg-blue-50 rounded-xl border border-blue-100 overflow-hidden">
                <PreviewPanelHeader />
                <PreviewPanelLogo />
                <PreviewPanelDetails
                    realmName={realmName}
                    bundle={bundle}
                    features={features}
                />

                <div className="px-6 pb-6">
                    <div className="flex items-center gap-2 text-blue-600 text-xs h-8">
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">!</div>
                        Fill the form to see preview
                    </div>
                </div>
            </div>

            <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-lg font-medium rounded-xl shadow-lg shadow-purple-200"
                onClick={handleSubmit}
                disabled={isLoading}
            >
                {isLoading ? 'Creating...' : (
                    <span className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" /> Submit
                    </span>
                )}
            </Button>
        </div>
    )
}
