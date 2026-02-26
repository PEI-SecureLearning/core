import { useState, useEffect } from 'react'
import axios, { AxiosError } from 'axios'
import { useKeycloak } from '@react-keycloak/web'
import { useNavigate } from '@tanstack/react-router'
import { TenantForm } from './admin/TenantForm'
import { PreviewPanel } from './admin/PreviewPanel'
import { toast } from 'sonner'

export function CreateTenantPage() {
    const { keycloak } = useKeycloak()
    const navigate = useNavigate()
    const [realmName, setRealmName] = useState('')
    const [domain, setDomain] = useState('')
    const [adminEmail, setAdminEmail] = useState('')
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
    const [features, setFeatures] = useState({
        phishing: true,
        lms: true
    })
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        return () => {
            if (logoPreviewUrl) {
                URL.revokeObjectURL(logoPreviewUrl)
            }
        }
    }, [logoPreviewUrl])

    const handleLogoSelect = (file: File | null) => {
        if (logoPreviewUrl) {
            URL.revokeObjectURL(logoPreviewUrl)
        }
        if (!file) {
            setLogoFile(null)
            setLogoPreviewUrl(null)
            return
        }
        const previewUrl = URL.createObjectURL(file)
        setLogoFile(file)
        setLogoPreviewUrl(previewUrl)
    }

    const extractDetailText = (detail: unknown): string => {
        if (typeof detail === 'string') return detail.trim()
        if (!Array.isArray(detail) || detail.length === 0) return ''
        const first = detail[0] as { msg?: unknown } | string
        if (typeof first === 'string') return first
        if (typeof first?.msg === 'string') return first.msg
        return ''
    }

    const getStatusErrorMessage = (status?: number): string | null => {
        if (status === 401) return 'Your session expired. Please log in again and retry.'
        if (status === 403) return 'You do not have permission to create tenants.'
        if (status === 400 || status === 422) return 'Some tenant details are invalid. Please review the form.'
        if (status && status >= 500) return 'Server error while creating tenant. Please try again in a moment.'
        return null
    }

    const getCreateTenantErrorMessage = (error: unknown): string => {
        if (!axios.isAxiosError(error)) return 'Failed to create tenant. Please try again.'

        const axiosError = error as AxiosError<{ detail?: unknown }>
        const status = axiosError.response?.status
        const detailText = extractDetailText(axiosError.response?.data?.detail)
        const lowered = `${detailText} ${axiosError.message || ''}`.toLowerCase()

        if (lowered.includes('already exists') || lowered.includes('duplicate') || lowered.includes('conflict') || status === 409) {
            return `A tenant named "${realmName}" already exists. Please choose another name.`
        }
        if (lowered.includes('domain')) return `The domain "${domain}" is invalid or already in use.`
        if (lowered.includes('email')) return `The admin email "${adminEmail}" is invalid for this tenant.`
        if (!axiosError.response) return 'Could not reach the server. Check your connection and try again.'

        return getStatusErrorMessage(status) || detailText || 'Failed to create tenant. Please try again.'
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const normalizedDomain = domain.trim().toLowerCase()
            if (!normalizedDomain) {
                toast.error('Domain is required.')
                return
            }

            try {
                await axios.get(
                    `${import.meta.env.VITE_API_URL}/realms`,
                    {
                        params: { domain: normalizedDomain },
                        headers: {
                            Authorization: `Bearer ${keycloak.token}`,
                        },
                    }
                )
                toast.error(`The domain "${normalizedDomain}" is already in use.`)
                return
            } catch (lookupError) {
                if (axios.isAxiosError(lookupError)) {
                    const status = lookupError.response?.status
                    if (status && status !== 404) {
                        throw lookupError
                    }
                }
            }

            await axios.post(
                `${import.meta.env.VITE_API_URL}/realms`,
                {
                    name: realmName,
                    domain: normalizedDomain,
                    adminEmail,
                    features
                },
                {
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`,
                    },
                }
            )
            if (logoFile) {
                const formData = new FormData()
                formData.append('file', logoFile)
                try {
                    await axios.post(
                        `${import.meta.env.VITE_API_URL}/realms/${encodeURIComponent(realmName)}/logo`,
                        formData,
                        {
                            headers: {
                                Authorization: `Bearer ${keycloak.token}`,
                            },
                        }
                    )
                } catch (logoError) {
                    console.error('Error uploading logo:', logoError)
                    toast.error('Tenant created, but logo upload failed')
                }
            }
            toast.success(`Tenant "${realmName}" created successfully!`, { position: 'top-right' })
            setRealmName('')
            setDomain('')
            setAdminEmail('')
            handleLogoSelect(null)
            navigate({ to: '/admin/tenants' })
        } catch (error) {
            console.error('Error creating realm:', error)
            toast.error(getCreateTenantErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="h-full w-full bg-gradient-to-br from-gray-50 to-purple-50/30 overflow-y-auto">
            <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Scrollable form section */}
                <div className="flex-1 min-w-0">
                    <TenantForm
                        realmName={realmName}
                        setRealmName={setRealmName}
                        domain={domain}
                        setDomain={setDomain}
                        adminEmail={adminEmail}
                        setAdminEmail={setAdminEmail}
                        features={features}
                        setFeatures={setFeatures}
                        logoPreviewUrl={logoPreviewUrl}
                        onLogoSelect={handleLogoSelect}
                        handleSubmit={handleSubmit}
                    />
                </div>

                {/* Preview panel - stacks below form on small screens */}
                <div className="w-full lg:w-80 lg:flex-shrink-0">
                    <PreviewPanel
                        realmName={realmName}
                        features={features}
                        logoPreviewUrl={logoPreviewUrl}
                        isLoading={isLoading}
                        handleSubmit={handleSubmit}
                    />
                </div>
            </div>
        </div>
    )
}
