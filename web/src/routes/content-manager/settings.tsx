import { createFileRoute } from '@tanstack/react-router'
import { SettingsPanel } from '@/components/SettingsPanel'

export const Route = createFileRoute('/content-manager/settings')({
    component: RouteComponent,
})

function RouteComponent() {
    return <SettingsPanel />
}
