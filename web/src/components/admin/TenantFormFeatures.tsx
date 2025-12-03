import { Plug, Shield, BookOpen, Plus } from 'lucide-react'

interface TenantFormFeaturesProps {
    features: { phishing: boolean; lms: boolean }
    setFeatures: React.Dispatch<React.SetStateAction<{ phishing: boolean; lms: boolean }>>
}

export function TenantFormFeatures({
    features, setFeatures
}: TenantFormFeaturesProps) {
    return (
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 h-full">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 h-6">
                <Plug className="w-4 h-4 text-purple-600" /> Feature selection
            </h3>
            <div className="space-y-3">
                <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-blue-100 h-20">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Shield className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-gray-900">Phishing Campaign Module</h4>
                            <button
                                type="button"
                                onClick={() => setFeatures(f => ({ ...f, phishing: !f.phishing }))}
                                className="text-xs text-red-500 hover:text-red-600"
                            >
                                {features.phishing ? 'Remove' : 'Add'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Enable phishing simulation campaigns</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-blue-100 h-20">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-gray-900">LMS Training Module</h4>
                            <button
                                type="button"
                                onClick={() => setFeatures(f => ({ ...f, lms: !f.lms }))}
                                className="text-xs text-red-500 hover:text-red-600"
                            >
                                {features.lms ? 'Remove' : 'Add'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Enable learning management system</p>
                    </div>
                </div>
                <button type="button" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 px-2 h-8">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                    </div>
                    Add new
                </button>
            </div>
        </div>
    )
}
