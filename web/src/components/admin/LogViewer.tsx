import { useState } from 'react'
import { Search, AlertCircle, Info, CheckCircle } from 'lucide-react'

interface LogEntry {
    id: string
    timestamp: string
    level: 'info' | 'warning' | 'error' | 'success'
    message: string
    source: string
    user?: string
}

const MOCK_LOGS: LogEntry[] = [
    { id: '1', timestamp: '2024-03-20 10:30:15', level: 'error', message: 'Failed to connect to Keycloak server', source: 'Auth Service', user: 'System' },
    { id: '2', timestamp: '2024-03-20 10:29:55', level: 'success', message: 'New tenant "Acme Corp" created successfully', source: 'Admin API', user: 'admin@pei.com' },
    { id: '3', timestamp: '2024-03-20 10:28:12', level: 'info', message: 'User login attempt', source: 'Auth Service', user: 'john@example.com' },
    { id: '4', timestamp: '2024-03-20 10:25:00', level: 'warning', message: 'High memory usage detected', source: 'System Monitor', user: 'System' },
    { id: '5', timestamp: '2024-03-20 10:24:45', level: 'info', message: 'Scheduled backup completed', source: 'Backup Service', user: 'System' },
    { id: '6', timestamp: '2024-03-20 10:22:10', level: 'success', message: 'User "jane@example.com" role updated to "Manager"', source: 'User Management', user: 'admin@pei.com' },
    { id: '7', timestamp: '2024-03-20 10:20:05', level: 'error', message: 'Database connection timeout', source: 'Database', user: 'System' },
    { id: '8', timestamp: '2024-03-20 10:18:30', level: 'info', message: 'New terms of service uploaded', source: 'Terms Manager', user: 'legal@pei.com' },
    { id: '9', timestamp: '2024-03-20 10:15:00', level: 'warning', message: 'API rate limit approaching for tenant "Globex"', source: 'API Gateway', user: 'System' },
    { id: '10', timestamp: '2024-03-20 10:12:45', level: 'success', message: 'Phishing campaign "Q1 Security Test" launched', source: 'Phishing Service', user: 'security@pei.com' },
    { id: '11', timestamp: '2024-03-20 10:10:20', level: 'info', message: 'User logout', source: 'Auth Service', user: 'mike@example.com' },
    { id: '12', timestamp: '2024-03-20 10:05:00', level: 'info', message: 'System health check passed', source: 'Health Monitor', user: 'System' },
]

export function LogViewer() {
    const [logs] = useState(MOCK_LOGS)
    const [filter, setFilter] = useState('all')

    const getIcon = (level: LogEntry['level']) => {
        switch (level) {
            case 'error': return <AlertCircle className="text-red-500" size={18} />
            case 'warning': return <AlertCircle className="text-yellow-500" size={18} />
            case 'success': return <CheckCircle className="text-green-500" size={18} />
            default: return <Info className="text-blue-500" size={18} />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Platform Logs</h2>
                    <p className="text-gray-500 mt-1">Monitor system activity and events</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                        Export Logs
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                        Live Mode
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
                <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50 rounded-t-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Levels</option>
                        <option value="error">Errors</option>
                        <option value="warning">Warnings</option>
                        <option value="info">Info</option>
                    </select>
                </div>

                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500 w-48">Timestamp</th>
                                <th className="px-6 py-3 font-medium text-gray-500 w-24">Level</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Message</th>
                                <th className="px-6 py-3 font-medium text-gray-500 w-40">Source</th>
                                <th className="px-6 py-3 font-medium text-gray-500 w-40">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 font-mono">
                                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{log.timestamp}</td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getIcon(log.level)}
                                            <span className="capitalize text-gray-700">{log.level}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-900">{log.message}</td>
                                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{log.source}</td>
                                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{log.user}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
