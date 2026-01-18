import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Building2, Plus, ToggleLeft, ToggleRight, ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { apiClient } from '../../lib/api-client'
import { useConfirm } from '../ui/confirm-modal'
import { toast } from 'sonner'
import { motion } from 'motion/react'

interface Tenant {
    id: string
    realm: string
    displayName: string
    domain: string | null
    enabled: boolean
    features: Record<string, boolean>
    logoUpdatedAt?: string | null
}

interface TenantsResponse {
    realms: Array<{
        id: string
        realm: string
        displayName: string
        domain: string | null
        enabled: boolean
        features: Record<string, boolean>
        logoUpdatedAt?: string | null
    }>
}

export function TenantList() {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [logoError, setLogoError] = useState<Record<string, boolean>>({})
    const confirm = useConfirm()
    const API_BASE = import.meta.env.VITE_API_URL

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    const fetchTenants = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await apiClient.get<TenantsResponse>('/realms/tenants')
            // Map API response to Tenant interface with features from Keycloak
            const mappedTenants: Tenant[] = response.realms.map(realm => ({
                id: realm.id,
                realm: realm.realm,
                displayName: realm.displayName,
                domain: realm.domain,
                enabled: realm.enabled,
                features: realm.features || {},
                logoUpdatedAt: realm.logoUpdatedAt,
            }))
            setTenants(mappedTenants)
            setLogoError({})
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tenants')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTenants()
    }, [])

    const deleteTenant = async (tenant: Tenant) => {
        const confirmed = await confirm({
            title: 'Delete Tenant',
            message: `Are you sure you want to delete "${tenant.displayName}"? This action cannot be undone and will permanently remove the organization and all its users.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        })

        if (!confirmed) return

        try {
            setDeleting(tenant.realm)
            await apiClient.delete(`/realms/${tenant.realm}`)
            toast.success(`Tenant "${tenant.displayName}" deleted successfully`)
            // Refresh the tenant list
            await fetchTenants()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete tenant')
            setError(err instanceof Error ? err.message : 'Failed to delete tenant')
        } finally {
            setDeleting(null)
        }
    }

    const toggleFeature = (tenantId: string, feature: string) => {
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

    // Helper function to format feature names for display
    const formatFeatureName = (feature: string): string => {
        return feature
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim()
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center"
            >
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
            </motion.div>

            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center items-center py-12"
                >
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <span className="ml-3 text-gray-600">Loading tenants...</span>
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
                >
                    <p className="font-medium">Failed to load tenants</p>
                    <p className="text-sm mt-1">{error}</p>
                </motion.div>
            )}

            {!loading && !error && tenants.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
                >
                    <Building2 className="mx-auto text-gray-400" size={48} />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No tenants yet</h3>
                    <p className="mt-2 text-gray-500">Get started by creating your first tenant.</p>
                </motion.div>
            )}

            {!loading && !error && tenants.length > 0 && (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {tenants.map((tenant) => (
                        <motion.div
                            key={tenant.id}
                            variants={item}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 overflow-hidden">
                                            {!logoError[tenant.realm] ? (
                                                <img
                                                    src={`${API_BASE}/realms/${encodeURIComponent(tenant.realm)}/logo${tenant.logoUpdatedAt ? `?v=${encodeURIComponent(tenant.logoUpdatedAt)}` : ''}`}
                                                    alt={`${tenant.displayName} logo`}
                                                    className="w-full h-full object-contain"
                                                    onError={() =>
                                                        setLogoError((prev) => ({ ...prev, [tenant.realm]: true }))
                                                    }
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <Building2 size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{tenant.displayName}</h3>
                                            <div className="text-sm text-gray-500">{tenant.domain || tenant.realm}</div>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {tenant.enabled ? 'Active' : 'Disabled'}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Realm</span>
                                        <span className="font-medium text-gray-900">{tenant.realm}</span>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Feature Access</h4>
                                        <div className="space-y-3">
                                            {Object.keys(tenant.features).length === 0 ? (
                                                <p className="text-sm text-gray-400 italic">No features configured</p>
                                            ) : (
                                                Object.entries(tenant.features).map(([featureName, isEnabled]) => (
                                                    <div key={featureName} className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-700">{formatFeatureName(featureName)}</span>
                                                        <button
                                                            onClick={() => toggleFeature(tenant.id, featureName)}
                                                            className={`text-2xl ${isEnabled ? 'text-blue-600' : 'text-gray-300'}`}
                                                        >
                                                            {isEnabled ? <ToggleRight /> : <ToggleLeft />}
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <button
                                        onClick={() => deleteTenant(tenant)}
                                        disabled={deleting === tenant.realm}
                                        className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {deleting === tenant.realm ? (
                                            <Loader2 className="animate-spin" size={14} />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                        Delete
                                    </button>
                                    <Link
                                        to="/admin/tenants/$tenantId"
                                        params={{ tenantId: tenant.realm }}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        Manage Tenant <ExternalLink size={14} />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}
