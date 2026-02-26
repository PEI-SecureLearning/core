import { createFileRoute } from '@tanstack/react-router'
import ContManDashboard from '../../Pages/cont-man-dashboard'

export const Route = createFileRoute('/content-manager/')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <ContManDashboard />
    )
}