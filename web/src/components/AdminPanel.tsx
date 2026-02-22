import { useState, useEffect } from 'react'
import axios from 'axios'
import { useKeycloak } from '@react-keycloak/web'
import { TenantForm } from './admin/TenantForm'
import { PreviewPanel } from './admin/PreviewPanel'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/realms`,
                {
                    name: realmName,
                    domain: domain,
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
            toast.success('Realm created successfully!')
            navigate({ to: '/admin/tenants' })
            setRealmName('')
            setDomain('')
            setAdminEmail('')
            handleLogoSelect(null)
        } catch (error) {
            console.error('Error creating realm:', error)
            toast.error('Failed to create realm')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="h-full w-full bg-gradient-to-br from-gray-50 to-purple-50/30 flex">
            <div className="h-full w-full max-w-6xl mx-auto p-6 flex gap-8">
                {/* Scrollable form section */}
                <div className="flex-1 h-full overflow-y-auto pr-2">
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

                {/* Fixed preview panel - doesn't scroll */}
                <div className="flex-shrink-0">
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
