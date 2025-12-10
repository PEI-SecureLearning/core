import { Plug, Shield, BookOpen, Check } from 'lucide-react'

interface TenantFormFeaturesProps {
    features: { phishing: boolean; lms: boolean }
    setFeatures: React.Dispatch<React.SetStateAction<{ phishing: boolean; lms: boolean }>>
}

interface FeatureCardProps {
    title: string
    description: string
    icon: React.ReactNode
    iconBg: string
    enabled: boolean
    onToggle: () => void
}

function FeatureCard({ title, description, icon, iconBg, enabled, onToggle }: FeatureCardProps) {
    return (
        <div
            onClick={onToggle}
            className={`
                relative cursor-pointer group
                p-4 rounded-2xl border-2 transition-all duration-300 ease-out
                ${enabled
                    ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-white shadow-lg shadow-purple-100/50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
            `}
        >
            {/* Selection indicator */}
            <div className={`
                absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center
                transition-all duration-300
                ${enabled
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 scale-100'
                    : 'bg-gray-200 scale-90 group-hover:scale-100'
                }
            `}>
                <Check className={`w-3.5 h-3.5 ${enabled ? 'text-white' : 'text-gray-400'}`} />
            </div>

            {/* Icon */}
            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mb-3
                transition-transform duration-300 group-hover:scale-110
                ${iconBg}
            `}>
                {icon}
            </div>

            {/* Content */}
            <h4 className="text-sm font-semibold text-gray-900 mb-1">{title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>

            {/* Status badge */}
            <div className={`
                mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                transition-all duration-300
                ${enabled
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-500'
                }
            `}>
                <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-purple-500' : 'bg-gray-400'}`} />
                {enabled ? 'Enabled' : 'Disabled'}
            </div>
        </div>
    )
}

export function TenantFormFeatures({
    features, setFeatures
}: TenantFormFeaturesProps) {
    return (
        <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 p-5 rounded-2xl border border-purple-100/50 h-full">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-200/50">
                    <Plug className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Feature Modules</h3>
                    <p className="text-xs text-gray-500">Select the modules to enable for this tenant</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <FeatureCard
                    title="Phishing Campaign"
                    description="Simulate phishing attacks to test and train your users' security awareness"
                    icon={<Shield className="w-6 h-6 text-orange-600" />}
                    iconBg="bg-gradient-to-br from-orange-100 to-orange-50"
                    enabled={features.phishing}
                    onToggle={() => setFeatures(f => ({ ...f, phishing: !f.phishing }))}
                />

                <FeatureCard
                    title="Learning Management"
                    description="Deliver security training courses with progress tracking and certifications"
                    icon={<BookOpen className="w-6 h-6 text-blue-600" />}
                    iconBg="bg-gradient-to-br from-blue-100 to-blue-50"
                    enabled={features.lms}
                    onToggle={() => setFeatures(f => ({ ...f, lms: !f.lms }))}
                />
            </div>

            {/* Summary footer */}
            <div className="mt-4 pt-4 border-t border-purple-100/50">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                        {[features.phishing, features.lms].filter(Boolean).length} of 2 modules selected
                    </span>
                    <span className="text-purple-600 font-medium">
                        {features.phishing && features.lms ? 'Full Access' :
                            features.phishing || features.lms ? 'Partial Access' : 'No Modules'}
                    </span>
                </div>
            </div>
        </div>
    )
}
