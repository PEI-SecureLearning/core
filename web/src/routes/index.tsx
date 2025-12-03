import { createFileRoute } from '@tanstack/react-router'
import { WelcomePage } from '@/components/WelcomePage';

export const Route = createFileRoute('/')({
  component: Index,
})


function Index() {
  return <WelcomePage />
}
