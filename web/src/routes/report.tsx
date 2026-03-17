import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '../components/ComingSoon'

export const Route = createFileRoute('/report')({
  component: () => (
    <ComingSoon
      feature="Report a Problem"
      description="Problem reporting is currently under development. If you have an urgent issue, please contact your administrator."
    />
  ),
})
