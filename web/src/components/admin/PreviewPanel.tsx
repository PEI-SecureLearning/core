import { Button } from '@/components/ui/button'
import { PreviewPanelHeader } from './PreviewPanelHeader'
import { PreviewPanelLogo } from './PreviewPanelLogo'
import { PreviewPanelDetails } from './PreviewPanelDetails'

interface PreviewPanelProps {
    realmName: string
    features: { phishing: boolean; lms: boolean }
    logoPreviewUrl: string | null
    isLoading: boolean
    handleSubmit: (e: React.FormEvent) => void
}

export function PreviewPanel({
    realmName,
    features,
    logoPreviewUrl,
    isLoading,
    handleSubmit
}: PreviewPanelProps) {
    return (
        <div className="w-full flex flex-col gap-2">
            <div className="bg-background/80 backdrop-blur-md rounded-md border border-border/60 overflow-hidden shadow-2xl shadow-primary/5">
                <PreviewPanelHeader />
                <PreviewPanelLogo logoPreviewUrl={logoPreviewUrl} />
                <PreviewPanelDetails
                    realmName={realmName}
                    features={features}
                />

            </div>

            <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 text-lg font-semibold rounded-xl shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
                        Create Tenant
                    </span>
                )}
            </Button>
        </div>
    )
}
