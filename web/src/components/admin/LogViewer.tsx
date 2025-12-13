import { useState, useEffect } from 'react'
import { Search, AlertCircle, Info, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { apiClient } from '../../lib/api-client'

interface LogEntry {
    id: string
    timestamp: number
    level: 'info' | 'warning' | 'error' | 'success'
    message: string
    source: string
    user?: string
    realm?: string
    details?: unknown
}

interface LogsResponse {
    logs: LogEntry[]
}

export function LogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const fetchLogs = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await apiClient.get<LogsResponse>('/logs?max_results=100')
            setLogs(response.logs || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load logs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const formatTimestamp = (timestamp: number): string => {
        if (!timestamp) return 'Unknown'
        const date = new Date(timestamp)
        return date.toLocaleString()
    }

    const getIcon = (level: LogEntry['level']) => {
        switch (level) {
            case 'error': return <AlertCircle className="text-red-500" size={18} />
            case 'warning': return <AlertCircle className="text-yellow-500" size={18} />
            case 'success': return <CheckCircle className="text-green-500" size={18} />
            default: return <Info className="text-blue-500" size={18} />
        }
    }

    const filteredLogs = logs.filter(log => {
        const matchesFilter = filter === 'all' || log.level === filter
        const matchesSearch = searchQuery === '' ||
            log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.user && log.user.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesFilter && matchesSearch
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Platform Logs</h2>
                    <p className="text-gray-500 mt-1">Monitor system activity and events</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-medium">Failed to load logs</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
                <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50 rounded-t-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                        <option value="success">Success</option>
                        <option value="info">Info</option>
                    </select>
                </div>

                <div className="flex-1 overflow-auto p-0">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                            <span className="ml-3 text-gray-600">Loading logs...</span>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col justify-center items-center py-12 text-gray-500">
                            <Info size={48} className="text-gray-300 mb-4" />
                            <p className="font-medium">No logs found</p>
                            <p className="text-sm mt-1">Events will appear here when activity occurs</p>
                        </div>
                    ) : (
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
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 font-mono">
                                        <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getIcon(log.level)}
                                                <span className="capitalize text-gray-700">{log.level}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-900">{log.message}</td>
                                        <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{log.source}</td>
                                        <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{log.user || 'System'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
