import { useState } from 'react'
import { Search, Filter, Shield, Trash2, Edit2 } from 'lucide-react'

interface User {
    id: string
    name: string
    email: string
    role: string
    group: string
    status: 'active' | 'inactive'
    lastActive: string
}

const MOCK_USERS: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', group: 'Engineering', status: 'active', lastActive: '2 mins ago' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User', group: 'Marketing', status: 'active', lastActive: '1 hour ago' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Manager', group: 'Sales', status: 'inactive', lastActive: '2 days ago' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'User', group: 'Engineering', status: 'active', lastActive: '5 mins ago' },
    { id: '5', name: 'Tom Brown', email: 'tom@example.com', role: 'User', group: 'Support', status: 'active', lastActive: '1 day ago' },
]

export function UserList() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedGroup, setSelectedGroup] = useState('All')

    const filteredUsers = MOCK_USERS.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesGroup = selectedGroup === 'All' || user.group === selectedGroup
        return matchesSearch && matchesGroup
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">User Management</h2>
                    <p className="text-muted-foreground mt-1">Manage users, roles, and permissions</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Shield size={18} />
                    Add User
                </button>
            </div>

            <div className="bg-background rounded-xl border border-border shadow-sm">
                <div className="p-4 border-b border-border flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={20} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={20} />
                        <select
                            className="pl-10 pr-8 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-background"
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                        >
                            <option value="All">All Groups</option>
                            <option value="Engineering">Engineering</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Sales">Sales</option>
                            <option value="Support">Support</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-subtle border-b border-border">
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-surface-subtle transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'Admin' ? 'bg-primary/20 text-primary/80' :
                                            user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                                                'bg-muted text-foreground'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.group}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-muted text-foreground'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-600' : 'bg-muted-foreground/50'
                                                }`} />
                                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.lastActive}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-muted-foreground/70 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2 text-muted-foreground/70 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
