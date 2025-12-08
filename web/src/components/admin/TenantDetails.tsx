import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Building2, ArrowLeft, UserPlus, Mail, Shield, CheckCircle, XCircle } from 'lucide-react'

export function TenantDetails() {
    const { tenantId } = useParams({ from: '/admin/tenants/$tenantId' })
    const [orgManagerEmail, setOrgManagerEmail] = useState('')

    // Mock data based on ID
    const tenant = {
        id: tenantId,
        name: 'Acme Corp',
        domain: 'acme.com',
        status: 'active',
        created: '2024-01-15',
        plan: 'Enterprise',
        users: { current: 150, limit: 500 },
        features: { phishing: true, lms: true, reports: true },
        manager: { name: 'John Doe', email: 'john@acme.com', status: 'active' }
    }

    const handleAddManager = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Adding manager:', orgManagerEmail)
        setOrgManagerEmail('')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/admin/tenants" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{tenant.name}</h2>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Building2 size={16} />
                        <span>{tenant.domain}</span>
                        <span className="mx-2">•</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {tenant.status.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Overview</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Plan Type</div>
                                <div className="font-medium text-gray-900">{tenant.plan}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Created On</div>
                                <div className="font-medium text-gray-900">{tenant.created}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">User Usage</div>
                                <div className="font-medium text-gray-900">
                                    {tenant.users.current} / {tenant.users.limit}
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                        <div
                                            className="bg-blue-600 h-1.5 rounded-full"
                                            style={{ width: `${(tenant.users.current / tenant.users.limit) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Manager</h3>
                        {tenant.manager ? (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                        {tenant.manager.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{tenant.manager.name}</div>
                                        <div className="text-sm text-gray-500">{tenant.manager.email}</div>
                                    </div>
                                </div>
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    Manage Access
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleAddManager} className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        placeholder="Enter manager email"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={orgManagerEmail}
                                        onChange={(e) => setOrgManagerEmail(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                    <UserPlus size={18} />
                                    Assign Manager
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Features</h3>
                        <div className="space-y-3">
                            {Object.entries(tenant.features).map(([feature, active]) => (
                                <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="capitalize text-gray-700">{feature}</span>
                                    {active ? (
                                        <CheckCircle size={20} className="text-green-500" />
                                    ) : (
                                        <XCircle size={20} className="text-gray-400" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Status</h3>
                        <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100">
                            <Shield size={20} />
                            <span className="font-medium">System Secure</span>
                        </div>
                        <div className="mt-4 text-sm text-gray-500">
                            Last security scan: 2 hours ago
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
