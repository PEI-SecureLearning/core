import { createFileRoute } from '@tanstack/react-router'
import { WelcomePage } from '@/components/WelcomePage'
import { contentManagerLinks } from '@/config/navLinks'
import { BookOpen } from 'lucide-react'

export const Route = createFileRoute('/content-manager/')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <WelcomePage
            links={contentManagerLinks}
            title={
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <BookOpen className="w-4 h-4" />
                        <span>Content Creation</span>
                    </div>
                    <div className="text-4xl font-bold text-foreground tracking-tight">
                        Content Manager Dashboard
                    </div>
                </div>
            }
            subtitle="Manage courses, modules, and content."
        />
    )
}