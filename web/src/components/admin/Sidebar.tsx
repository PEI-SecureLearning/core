import { Link } from '@tanstack/react-router'
import { Users, Building2, Activity, Settings } from 'lucide-react'

export function Sidebar() {
    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <Link
                    to="/admin/users"
                    className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
                    activeProps={{ className: 'bg-blue-50 text-blue-600' }}
                >
                    <Users size={20} />
                    <span className="font-medium">Users</span>
                </Link>
                <Link
                    to="/admin/tenants"
                    className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
                    activeProps={{ className: 'bg-blue-50 text-blue-600' }}
                >
                    <Building2 size={20} />
                    <span className="font-medium">Tenants</span>
                </Link>

                <Link
                    to="/admin/logs"
                    className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
                    activeProps={{ className: 'bg-blue-50 text-blue-600' }}
                >
                    <Activity size={20} />
                    <span className="font-medium">Platform Logs</span>
                </Link>
            </nav>
            <div className="p-4 border-t border-gray-200">
                <button className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg w-full transition-colors">
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </button>
            </div>
        </div>
    )
}
