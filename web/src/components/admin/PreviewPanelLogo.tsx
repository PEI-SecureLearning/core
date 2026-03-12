import { Image as ImageIcon } from 'lucide-react'

type PreviewPanelLogoProps = Readonly<{
    logoPreviewUrl: string | null
}>

export function PreviewPanelLogo({ logoPreviewUrl }: PreviewPanelLogoProps) {
    return (
        <div className="flex flex-col items-center py-4 border-b border-slate-100 bg-white/40">
            <div className={`
                w-28 h-28 rounded-[2rem] flex items-center justify-center overflow-hidden
                shadow-2xl shadow-purple-500/10 border-4 border-white transition-all duration-500
                ${logoPreviewUrl ? 'bg-white' : 'bg-slate-50'}
            `}>
                {logoPreviewUrl ? (
                    <img
                        src={logoPreviewUrl}
                        alt="Organization logo preview"
                        className="w-full h-full object-contain p-4"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                )}
            </div>

        </div>
    )
}
