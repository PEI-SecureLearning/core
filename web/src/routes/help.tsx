import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '../components/ComingSoon'

export const Route = createFileRoute('/help')({
  component: () => (
    <ComingSoon
      feature="Help Center"
      description="The help center is currently under development. For assistance, please reach out to your administrator."
    />
  ),
})
