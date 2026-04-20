import { Plug, Shield, BookOpen, Check } from 'lucide-react'
import { motion } from 'motion/react'

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
        <motion.button
            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(var(--primary-rgb), 0.1)" }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onToggle}
            className={`
                flex flex-row items-center w-full text-left relative cursor-pointer group
                p-4 rounded-2xl border-2 transition-all duration-300 ease-out
                ${enabled
                    ? 'border-primary bg-background shadow-xl shadow-primary/10'
                    : 'border-border/40 bg-surface-subtle/50 hover:border-border hover:bg-background'
                }
            `}
        >
            {/* Selection indicator */}

            <div className='flex-1 pr-4'>
                <div className={`
                        absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center
                        transition-all duration-500 z-10
                        ${enabled
                        ? 'bg-primary scale-100 rotate-0'
                        : 'bg-muted/60 scale-90 -rotate-12 group-hover:scale-100 group-hover:rotate-0'
                    }
                    `}>
                    <Check className={`w-3.5 h-3.5 transition-opacity ${enabled ? 'opacity-100 text-white' : 'opacity-0'}`} />
                </div>

                {/* Icon */}
                <div className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center mb-4
                        transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm
                        ${iconBg}
                    `}>
                    {icon}
                </div>

                {/* Content */}
                <h4 className={`text-[13px] font-bold mb-1 transition-colors duration-300 ${enabled ? 'text-primary' : 'text-foreground'}`}>
                    {title}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    {description}
                </p>
            </div>
            {/* Status badge */}
            <div className={`
                    shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider
                    transition-all duration-300 border
                    ${enabled
                    ? 'bg-primary text-white border-transparent'
                    : 'bg-background text-muted-foreground/70 border-border'
                }
                `}>
                <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-background animate-pulse' : 'bg-muted-foreground/40'}`} />
                {enabled ? 'Active feature' : 'Deployment Disabled'}
            </div>
        </motion.button>
    )
}

export function TenantFormFeatures({
    features, setFeatures
}: TenantFormFeaturesProps) {
    return (
        <div className="w-full bg-background p-2 rounded-2xl h-full flex flex-col">
            <div className="flex items-center gap-2  px-1">
                <div className="p-2 bg-primary rounded-lg shadow shadow-primary/20">
                    <Plug className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                    <h3 className="text-md font-bold text-foreground/90">Feature Modules</h3>
                    <p className="text-xs text-muted-foreground">Select features for this tenant</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[337px] pt-2 pr-2 custom-scrollbar mt-3">
                <FeatureCard
                    title="Phishing & Simulation"
                    description="Simulation engine with dynamic email & landing page templates."
                    icon={<Shield className="w-6 h-6 text-warning" />}
                    iconBg="bg-warning/10 border border-warning/20"
                    enabled={features.phishing}
                    onToggle={() => setFeatures(f => ({ ...f, phishing: !f.phishing }))}
                />

                <FeatureCard
                    title="LMS & Compliance"
                    description="Management system for training courses and progress tracking."
                    icon={<BookOpen className="w-6 h-6 text-info" />}
                    iconBg="bg-info/10 border border-info/20"
                    enabled={features.lms}
                    onToggle={() => setFeatures(f => ({ ...f, lms: !f.lms }))}
                />

            </div>
        </div>
    )
}

