import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TenantFormOrganizationProps {
    realmName: string
    setRealmName: (value: string) => void
    domain: string
    setDomain: (value: string) => void
    adminEmail: string
    setAdminEmail: (value: string) => void
}

export function TenantFormOrganization({
    realmName, setRealmName,
    domain, setDomain,
    adminEmail, setAdminEmail
}: TenantFormOrganizationProps) {
    return (
        <div className="flex-1 space-y-4">
            <div>
                <Label htmlFor="org-name" className="text-gray-700 block mb-1.5 text-xs font-semibold">Organization name<span className="text-red-500">*</span></Label>
                <Input
                    id="org-name"
                    placeholder="Enter name"
                    value={realmName}
                    onChange={(e) => setRealmName(e.target.value)}
                    className="h-10 bg-gray-50 border-gray-200"
                    required
                />
            </div>

            <div>
                <Label htmlFor="domain" className="text-gray-700 block mb-1.5 text-xs font-semibold">Domain pattern<span className="text-red-500">*</span></Label>
                <Input
                    id="domain"
                    placeholder="company.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="h-10 bg-gray-50 border-gray-200"
                    required
                />
            </div>

            <div>
                <Label htmlFor="admin-email" className="text-gray-700 block mb-1.5 text-xs font-semibold">Admin email<span className="text-red-500">*</span></Label>
                <Input
                    id="admin-email"
                    placeholder="admin@company.com"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="h-10 bg-gray-50 border-gray-200"
                    required
                />
            </div>
        </div>
    )
}
