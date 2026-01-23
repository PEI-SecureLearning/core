import { TenantFormOrganization } from './TenantFormOrganization'
import { TenantFormFeatures } from './TenantFormFeatures'
import { TenantFormLogo } from './TenantFormLogo'

interface TenantFormProps {
    realmName: string
    setRealmName: (value: string) => void
    domain: string
    setDomain: (value: string) => void
    adminEmail: string
    setAdminEmail: (value: string) => void
    features: { phishing: boolean; lms: boolean }
    setFeatures: React.Dispatch<React.SetStateAction<{ phishing: boolean; lms: boolean }>>
    logoPreviewUrl: string | null
    onLogoSelect: (file: File | null) => void
    handleSubmit: (e: React.FormEvent) => void
}

export function TenantForm({
    realmName, setRealmName,
    domain, setDomain,
    adminEmail, setAdminEmail,
    features, setFeatures,
    logoPreviewUrl,
    onLogoSelect,
    handleSubmit
}: TenantFormProps) {
    return (
        <div className="h-full flex-1 bg-white rounded-xl p-6 shadow-sm overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
                <TenantFormOrganization
                    realmName={realmName} setRealmName={setRealmName}
                    domain={domain} setDomain={setDomain}
                    adminEmail={adminEmail} setAdminEmail={setAdminEmail}
                />

                <div className="grid grid-cols-2 gap-6">
                    <TenantFormFeatures features={features} setFeatures={setFeatures} />
                    <TenantFormLogo
                        logoPreviewUrl={logoPreviewUrl}
                        onLogoSelect={onLogoSelect}
                    />
                </div>
            </form>
        </div>
    )
}
