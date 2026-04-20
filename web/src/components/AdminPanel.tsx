import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { TenantForm } from './admin/TenantForm'
import { PreviewPanel } from './admin/PreviewPanel'
import { getEmailDomain, isValidEmail } from '@/lib/emailValidation'
import { isValidTenantDomain, normalizeTenantDomain } from '@/lib/tenantDomainValidation'
import { apiClient } from '../lib/api-client'
import { toast } from 'sonner'

export function CreateTenantPage() {
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

    const getCreateTenantErrorMessage = (_error: unknown): string => {
        // The fetch-based client throws plain Error with message including statusText.
        // We can't reliably parse JSON body here, so return generic message.
        return 'Failed to create tenant. Please try again.'
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const normalizedDomain = normalizeTenantDomain(domain)
            const normalizedAdminEmail = adminEmail.trim().toLowerCase()
            const isAdminEmailFormatValid = isValidEmail(normalizedAdminEmail)
            const adminEmailDomain = getEmailDomain(normalizedAdminEmail) ?? ''
            if (!normalizedDomain) {
                toast.error('Domain is required.')
                return
            }
            if (!isValidTenantDomain(normalizedDomain)) {
                toast.error('Please provide a valid domain name.')
                return
            }
            if (!normalizedAdminEmail || !isAdminEmailFormatValid) {
                toast.error('Please provide a valid admin email.')
                return
            }
            if (adminEmailDomain !== normalizedDomain) {
                toast.error(`Admin email domain must match organization domain (${normalizedDomain}).`)
                return
            }

            try {
                await apiClient.get(
                    `/realms?domain=${encodeURIComponent(normalizedDomain)}`
                )
                toast.error(`The domain "${normalizedDomain}" is already in use.`)
                return
            } catch (lookupError) {
                if (lookupError instanceof Error && 'status' in lookupError) {
                    const status = (lookupError as any).status as number
                    if (status && status !== 404) {
                        throw lookupError
                    }
                }
                // any error means the domain was not found or another issue; continue
            }

            await apiClient.post(
                `/realms`,
                {
                    name: realmName,
                    domain: normalizedDomain,
                    adminEmail: normalizedAdminEmail,
                    features
                }
            )
            if (logoFile) {
                const formData = new FormData()
                formData.append('file', logoFile)
                try {
                    await apiClient.post(
                        `/realms/${encodeURIComponent(realmName)}/logo`,
                        formData
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
        <div className="w-full bg-gradient-to-br from-surface to-primary/5 overflow-y-auto">
            <div className="w-full max-w-8xl mx-auto p-2 sm:p-2 flex flex-col lg:flex-row items-start justify-center gap-8">
                {/* Form section */}
                <div className="flex-1 w-full">
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
