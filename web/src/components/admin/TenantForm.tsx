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
        <div className="w-full bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-row gap-6 items-start">
                    <TenantFormOrganization
                        realmName={realmName} setRealmName={setRealmName}
                        domain={domain} setDomain={setDomain}
                        adminEmail={adminEmail} setAdminEmail={setAdminEmail}
                    />
                    <TenantFormLogo
                        logoPreviewUrl={logoPreviewUrl}
                        onLogoSelect={onLogoSelect}
                    />
                </div>
                <div>
                    <TenantFormFeatures features={features} setFeatures={setFeatures} />
                </div>
            </form>
        </div>
    )
}
