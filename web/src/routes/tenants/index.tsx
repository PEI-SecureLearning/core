import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tenants/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <div className="flex justify-center items-center h-full w-full">
        <a
          href="/tenants/new-tenant"
          className="px-12 py-6 bg-primary text-white text-2xl font-bold rounded-2xl shadow-lg hover:bg-primary/80 transition-colors duration-200"
        >
          Go to Tenant Registry
        </a>
      </div>
    </div>
  )
}
