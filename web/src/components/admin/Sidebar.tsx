import { Link } from '@tanstack/react-router'
import { Users, Building2, Activity, Settings } from 'lucide-react'

export function Sidebar() {
    return (
        <div className="w-64 bg-background border-r border-border h-screen flex flex-col">
            <div className="p-6 border-b border-border">
                <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <Link
                    to="/admin/users"
                    className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-surface-subtle hover:text-blue-600 rounded-lg transition-colors"
                    activeProps={{ className: 'bg-blue-50 text-blue-600' }}
                >
                    <Users size={20} />
                    <span className="font-medium">Users</span>
                </Link>
                <Link
                    to="/admin/tenants"
                    className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-surface-subtle hover:text-blue-600 rounded-lg transition-colors"
                    activeProps={{ className: 'bg-blue-50 text-blue-600' }}
                >
                    <Building2 size={20} />
                    <span className="font-medium">Tenants</span>
                </Link>

                <Link
                    to="/admin/logs"
                    className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-surface-subtle hover:text-blue-600 rounded-lg transition-colors"
                    activeProps={{ className: 'bg-blue-50 text-blue-600' }}
                >
                    <Activity size={20} />
                    <span className="font-medium">Platform Logs</span>
                </Link>
            </nav>
            <div className="p-4 border-t border-border">
                <button className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-surface-subtle hover:text-foreground rounded-lg w-full transition-colors">
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </button>
            </div>
        </div>
    )
}
