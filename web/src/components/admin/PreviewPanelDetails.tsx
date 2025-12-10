import { CheckIcon, Shield, BookOpen } from 'lucide-react'

interface PreviewPanelDetailsProps {
    realmName: string
    features: { phishing: boolean; lms: boolean }
}

export function PreviewPanelDetails({
    realmName,
    features
}: PreviewPanelDetailsProps) {
    const enabledCount = [features.phishing, features.lms].filter(Boolean).length

    return (
        <div className="p-6 space-y-4">
            {/* Tenant Name */}
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-purple-100/50">
                <p className="text-xs font-medium text-purple-600 mb-1">Tenant Name</p>
                <p className="text-base font-semibold text-gray-900 truncate">
                    {realmName || 'Enter tenant name...'}
                </p>
            </div>

            {/* Enabled Modules */}
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-purple-100/50">
                <p className="text-xs font-medium text-purple-600 mb-3">
                    Enabled Modules ({enabledCount}/2)
                </p>
                <div className="space-y-2">
                    {features.phishing && (
                        <div className="flex items-center gap-3 p-2 bg-orange-50/80 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-800">Phishing Campaigns</span>
                            </div>
                            <CheckIcon className="w-4 h-4 text-orange-500" />
                        </div>
                    )}
                    {features.lms && (
                        <div className="flex items-center gap-3 p-2 bg-blue-50/80 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                                <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-medium text-gray-800">LMS Training</span>
                            </div>
                            <CheckIcon className="w-4 h-4 text-blue-500" />
                        </div>
                    )}
                    {!features.phishing && !features.lms && (
                        <p className="text-sm text-gray-400 text-center py-4">
                            No modules selected
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
