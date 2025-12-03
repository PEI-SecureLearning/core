import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Building2, Plus, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react'

interface Tenant {
    id: string
    name: string
    domain: string
    users: number
    status: 'active' | 'suspended'
    features: {
        phishing: boolean
        lms: boolean
        reports: boolean
    }
}

const MOCK_TENANTS: Tenant[] = [
    { id: '1', name: 'Acme Corp', domain: 'acme.com', users: 150, status: 'active', features: { phishing: true, lms: true, reports: true } },
    { id: '2', name: 'Globex Inc', domain: 'globex.com', users: 50, status: 'active', features: { phishing: true, lms: false, reports: true } },
    { id: '3', name: 'Soylent Corp', domain: 'soylent.com', users: 1200, status: 'suspended', features: { phishing: false, lms: true, reports: false } },
    { id: '4', name: 'Umbrella Corp', domain: 'umbrella.com', users: 5000, status: 'active', features: { phishing: true, lms: true, reports: true } },
]

export function TenantList() {
    const [tenants, setTenants] = useState(MOCK_TENANTS)

    const toggleFeature = (tenantId: string, feature: keyof Tenant['features']) => {
        setTenants(tenants.map(t => {
            if (t.id === tenantId) {
                return {
                    ...t,
                    features: {
                        ...t.features,
                        [feature]: !t.features[feature]
                    }
                }
            }
            return t
        }))
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
                    <p className="text-gray-500 mt-1">Manage organizations and their feature access</p>
                </div>
                <Link to="/admin/tenants/new-tenant">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Plus size={18} />
                        New Tenant
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants.map((tenant) => (
                    <div key={tenant.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                                        <div className="text-sm text-gray-500">{tenant.domain}</div>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Users</span>
                                    <span className="font-medium text-gray-900">{tenant.users.toLocaleString()}</span>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Feature Access</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-700">Phishing Sim</span>
                                            <button
                                                onClick={() => toggleFeature(tenant.id, 'phishing')}
                                                className={`text-2xl ${tenant.features.phishing ? 'text-blue-600' : 'text-gray-300'}`}
                                            >
                                                {tenant.features.phishing ? <ToggleRight /> : <ToggleLeft />}
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-700">LMS Platform</span>
                                            <button
                                                onClick={() => toggleFeature(tenant.id, 'lms')}
                                                className={`text-2xl ${tenant.features.lms ? 'text-blue-600' : 'text-gray-300'}`}
                                            >
                                                {tenant.features.lms ? <ToggleRight /> : <ToggleLeft />}
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-700">Advanced Reports</span>
                                            <button
                                                onClick={() => toggleFeature(tenant.id, 'reports')}
                                                className={`text-2xl ${tenant.features.reports ? 'text-blue-600' : 'text-gray-300'}`}
                                            >
                                                {tenant.features.reports ? <ToggleRight /> : <ToggleLeft />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                <Link
                                    to="/admin/tenants/$tenantId"
                                    params={{ tenantId: tenant.id }}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    Manage Tenant <ExternalLink size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
