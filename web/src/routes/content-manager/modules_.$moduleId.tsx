import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ModuleDetailView } from '@/components/content-manager/ModuleDetailView'
import { PLACEHOLDER_MODULES } from '@/components/content-manager/module-creation/placeholderModules'

export const Route = createFileRoute('/content-manager/modules_/$moduleId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { moduleId } = Route.useParams()
    const navigate = useNavigate()

    const mod = PLACEHOLDER_MODULES.find(m => m.id === moduleId)

    if (!mod) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-3 text-slate-400 py-20">
                <p className="text-lg font-semibold text-slate-700">Module not found</p>
                <button
                    type="button"
                    onClick={() => navigate({ to: '/content-manager/modules' })}
                    className="text-sm text-purple-600 hover:text-purple-800 transition-colors"
                >
                    ← Back to Modules
                </button>
            </div>
        )
    }

    return (
        <ModuleDetailView
            data={mod}
            onBack={() => navigate({ to: '/content-manager/modules' })}
            interactive={false}
        />
    )
}
