import { useState, useEffect, useRef } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import type { MouseEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Building2, Plus, ToggleLeft, ToggleRight, ExternalLink, Loader2, Trash2, Shield, BookOpen, Check } from 'lucide-react'
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
    const { keycloak } = useKeycloak()
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [confirmingRealm, setConfirmingRealm] = useState<string | null>(null)
    const [logoError, setLogoError] = useState<Record<string, boolean>>({})
    const deleteInFlight = useRef<Set<string>>(new Set())
    const confirm = useConfirm()
    const API_BASE = import.meta.env.VITE_API_URL

    const getLogoUrl = (realm: string, updatedAt?: string | null) => {
        const version = updatedAt ? encodeURIComponent(updatedAt) : ''
        const query = version ? `?v=${version}` : ''
        return `${API_BASE}/realms/${encodeURIComponent(realm)}/logo${query}`
    }

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
        if (!keycloak.authenticated) return
        fetchTenants()
    }, [keycloak.authenticated])

    const deleteTenant = async (tenant: Tenant) => {
        if (deleteInFlight.current.has(tenant.realm) || deleting === tenant.realm || confirmingRealm === tenant.realm) {
            return
        }
        setConfirmingRealm(tenant.realm)
        const confirmed = await confirm({
            title: 'Delete Tenant',
            message: `Are you sure you want to delete "${tenant.displayName}"? This action cannot be undone and will permanently remove the organization and all its users.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        })
        setConfirmingRealm(null)

        if (!confirmed) return

        try {
            if (deleteInFlight.current.has(tenant.realm)) return
            deleteInFlight.current.add(tenant.realm)
            setDeleting(tenant.realm)
            await apiClient.delete(`/realms/${tenant.realm}`)
            toast.success(`Tenant "${tenant.displayName}" deleted successfully`)
            // Refresh the tenant list
            await fetchTenants()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete tenant'
            const lower = message.toLowerCase()
            if (lower.includes('404') || lower.includes('not found')) {
                // Treat duplicate delete as idempotent success.
                toast.success(`Tenant "${tenant.displayName}" was already deleted`)
                await fetchTenants()
            } else {
                toast.error(message)
                setError(message)
            }
        } finally {
            deleteInFlight.current.delete(tenant.realm)
            setDeleting(null)
        }
    }

    const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>, tenant: Tenant) => {
        event.preventDefault()
        event.stopPropagation()
        void deleteTenant(tenant)
    }

    const toggleFeature = async (tenantId: string, feature: string) => {
        const tenant = tenants.find(t => t.id === tenantId)
        if (!tenant) return

        const currentStatus = tenant.features[feature]
        const newStatus = !currentStatus

        // Optimistically update
        setTenants(prev => prev.map(t => {
            if (t.id === tenantId) {
                return {
                    ...t,
                    features: {
                        ...t.features,
                        [feature]: newStatus
                    }
                }
            }
            return t
        }))

        try {
            await apiClient.patch(`/realms/${tenant.realm}/features/${feature}`, { enabled: newStatus })
            toast.success(`${formatFeatureName(feature)} ${newStatus ? 'enabled' : 'disabled'} for ${tenant.displayName}`)
        } catch (err) {
            // Revert on error
            setTenants(prev => prev.map(t => {
                if (t.id === tenantId) {
                    return {
                        ...t,
                        features: {
                            ...t.features,
                            [feature]: currentStatus
                        }
                    }
                }
                return t
            }))
            toast.error(err instanceof Error ? err.message : 'Failed to toggle feature')
        }
    }

    // Helper function to format feature names for display
    const formatFeatureName = (feature: string): string => {
        if (feature === 'phishing') return 'Phishing Engine'
        if (feature === 'lms') return 'LMS Engine'
        return feature
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim()
    }

    const getFeatureIcon = (feature: string) => {
        if (feature === 'phishing') return <Shield size={14} className="text-warning" />
        if (feature === 'lms') return <BookOpen size={14} className="text-info" />
        return <Check size={14} className="text-primary/90" />
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center border-b-2 border-border pb-3"
            >
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Tenant Management</h2>
                    <p className="text-muted-foreground mt-1">Manage organizations and their feature access</p>
                </div>
                <Link to="/admin/tenants/new-tenant">
                    <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary transition-colors flex items-center gap-2">
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
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <span className="ml-3 text-muted-foreground font-medium">Loading tenants...</span>
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-error/10 border border-error/20 rounded-lg p-4 text-error"
                >
                    <p className="font-medium">Failed to load tenants</p>
                    <p className="text-sm mt-1">{error}</p>
                </motion.div>
            )}

            {!loading && !error && tenants.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface-subtle border border-border rounded-lg p-8 text-center"
                >
                    <Building2 className="mx-auto text-muted-foreground/70" size={48} />
                    <h3 className="mt-4 text-lg font-medium text-foreground">No tenants yet</h3>
                    <p className="mt-2 text-muted-foreground">Get started by creating your first tenant.</p>
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
                            whileHover={{
                                y: -5,
                                boxShadow: "0 20px 25px -5px rgba(var(--primary-rgb), 0.08), 0 8px 10px -6px rgba(var(--primary-rgb), 0.08)"
                            }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-background rounded-md border border-border/60 shadow-sm overflow-hidden group/card"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
                                            {logoError[tenant.realm] ? (
                                                <Building2 size={24} />
                                            ) : (
                                                <img
                                                    src={getLogoUrl(tenant.realm, tenant.logoUpdatedAt)}
                                                    alt={`${tenant.displayName} logo`}
                                                    className="w-full h-full object-contain"
                                                    onError={() =>
                                                        setLogoError((prev) => ({ ...prev, [tenant.realm]: true }))
                                                    }
                                                    loading="lazy"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{tenant.displayName}</h3>
                                            <div className="text-sm text-muted-foreground">{tenant.domain || tenant.realm}</div>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tenant.enabled
                                        ? 'bg-success/10 text-success border border-success/20'
                                        : 'bg-error/10 text-error border border-error/20'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tenant.enabled ? 'bg-success animate-pulse' : 'bg-error'}`} />
                                        {tenant.enabled ? 'Active' : 'Disabled'}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Realm</span>
                                        <span className="font-medium text-foreground">{tenant.realm}</span>
                                    </div>

                                    <div className="pt-4 border-t border-border/40">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Feature Access</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {Object.keys(tenant.features).length === 0 ? (
                                                <p className="text-sm text-muted-foreground/70 italic">No features configured</p>
                                            ) : (
                                                Object.entries(tenant.features).map(([featureName, isEnabled]) => (
                                                    <motion.div
                                                        key={featureName}
                                                        whileHover={{
                                                            scale: 1.02,
                                                            backgroundColor: isEnabled ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(var(--surface-rgb), 0.5)',
                                                            transition: { duration: 0.15, ease: "easeOut" }
                                                        }}
                                                        className={`
                                                            flex justify-between items-center p-2 rounded-xl border transition-all duration-200
                                                            ${isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-surface-subtle/50 border-border/40 opacity-60'}
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-lg ${isEnabled ? 'bg-background shadow-sm' : 'bg-muted'}`}>
                                                                {getFeatureIcon(featureName)}
                                                            </div>
                                                            <span className={`text-[11px] font-bold ${isEnabled ? 'text-foreground/90' : 'text-muted-foreground/70'}`}>
                                                                {formatFeatureName(featureName)}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleFeature(tenant.id, featureName)}
                                                            className={`transition-all duration-200 ${isEnabled ? 'text-primary' : 'text-muted-foreground/50'} hover:scale-110 active:scale-95`}
                                                        >
                                                            {isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                                        </button>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-border/40 flex justify-between items-center">
                                    <button
                                        onClick={(event) => handleDeleteClick(event, tenant)}
                                        disabled={deleting === tenant.realm || confirmingRealm === tenant.realm}
                                        className="text-sm font-medium text-error hover:text-error/80 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        className="text-sm font-bold text-primary hover:text-primary flex items-center gap-1.5 group/link"
                                    >
                                        Manage Tenant
                                        <ExternalLink size={14} className="transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
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
