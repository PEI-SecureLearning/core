import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { useKeycloak } from '@react-keycloak/web'
import { ModuleCreationForm } from '@/components/content-manager/ModuleCreationForm'

export const Route = createFileRoute('/content-manager/modules/new')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()
    const { keycloak } = useKeycloak()

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="w-full h-full py-4 px-6 bg-gray-50/50 flex flex-col"
        >
            {/* Header */}
            <div className="w-full h-[8%] flex flex-row items-center gap-4 relative z-10">
                <button
                    onClick={() => navigate({ to: '/content-manager/modules' })}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Modules
                </button>
                <div className="h-5 w-px bg-slate-300" />
                <h1 className="text-2xl font-bold text-slate-900">Create Module</h1>
            </div>

            {/* Content */}
            <div className="w-full flex-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <ModuleCreationForm
                    token={keycloak.token}
                    onSuccess={() => navigate({ to: '/content-manager/modules' })}
                />
            </div>
        </motion.div>
    )
}
