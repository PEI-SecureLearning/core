import { createFileRoute } from '@tanstack/react-router'
import { InteractionChart } from '../components/statistics/InteractionChart'
import { RiskLevel } from '../components/statistics/RiskLevel'

export const Route = createFileRoute('/statistics')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Statistics Dashboard</h1>
      <RiskLevel />
      <InteractionChart />
    </div>
  );
}
