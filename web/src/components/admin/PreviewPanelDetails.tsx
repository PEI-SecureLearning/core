import { CheckIcon } from 'lucide-react'

interface PreviewPanelDetailsProps {
    realmName: string
    bundle: string
    features: { phishing: boolean; lms: boolean }
}

export function PreviewPanelDetails({
    realmName,
    bundle,
    features
}: PreviewPanelDetailsProps) {
    return (
        <div className="h-60 p-6 space-y-6 overflow-y-auto">
            <div className="bg-white/50 p-3 rounded-lg h-16 flex flex-col justify-center">
                <p className="text-xs text-gray-500 mb-1">Tenant Name</p>
                <p className="text-sm font-medium text-gray-900 truncate">{realmName || 'Not specified'}</p>
            </div>

            <div className="bg-white/50 p-3 rounded-lg h-16 flex flex-col justify-center">
                <p className="text-xs text-gray-500 mb-1">Bundle pack</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{bundle || 'Not selected'}</p>
            </div>

            <div className="bg-white/50 p-3 rounded-lg min-h-[100px]">
                <p className="text-xs text-gray-500 mb-2">Enabled Modules</p>
                <div className="space-y-2">
                    {features.phishing && (
                        <div className="flex items-center gap-2 h-6">
                            <div className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center">
                                <CheckIcon className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm text-gray-700">Phishing Campaigns</span>
                        </div>
                    )}
                    {features.lms && (
                        <div className="flex items-center gap-2 h-6">
                            <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                                <CheckIcon className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm text-gray-700">LMS Training</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
