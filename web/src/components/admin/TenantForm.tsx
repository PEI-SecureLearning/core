import { TenantFormOrganization } from './TenantFormOrganization'
import { TenantFormUsers } from './TenantFormUsers'
import { TenantFormFeatures } from './TenantFormFeatures'
import { TenantFormLogo } from './TenantFormLogo'

interface TenantFormProps {
    realmName: string
    setRealmName: (value: string) => void
    domain: string
    setDomain: (value: string) => void
    adminEmail: string
    setAdminEmail: (value: string) => void
    userCount: string
    setUserCount: (value: string) => void
    bundle: string
    setBundle: (value: string) => void
    features: { phishing: boolean; lms: boolean }
    setFeatures: React.Dispatch<React.SetStateAction<{ phishing: boolean; lms: boolean }>>
    handleSubmit: (e: React.FormEvent) => void
}

export function TenantForm({
    realmName, setRealmName,
    domain, setDomain,
    adminEmail, setAdminEmail,
    userCount, setUserCount,
    bundle, setBundle,
    features, setFeatures,
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

                <TenantFormUsers
                    userCount={userCount} setUserCount={setUserCount}
                    bundle={bundle} setBundle={setBundle}
                />

                <div className="grid grid-cols-2 gap-6">
                    <TenantFormFeatures features={features} setFeatures={setFeatures} />
                    <TenantFormLogo />
                </div>
            </form>
        </div>
    )
}
