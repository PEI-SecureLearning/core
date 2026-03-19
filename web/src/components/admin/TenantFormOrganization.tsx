import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RequiredAsterisk from '@/components/shared/RequiredAsterisk'
import { getEmailDomain, isValidEmail } from '@/lib/emailValidation'

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
}: Readonly<TenantFormOrganizationProps>) {

    const normalizedDomain = domain.trim().toLowerCase().replace(/^@/, '').replace(/^\*\./, '')
    const normalizedEmail = adminEmail.trim().toLowerCase()
    const isAdminEmailFormatValid = !!normalizedEmail && isValidEmail(normalizedEmail)
    const adminEmailDomain = getEmailDomain(normalizedEmail) ?? ''
    const isAdminEmailDomainMatching =
        !normalizedDomain || !adminEmailDomain || adminEmailDomain === normalizedDomain
    const isAdminEmailValid = isAdminEmailFormatValid && isAdminEmailDomainMatching

    return (
        <div className="flex-1 space-y-4">
            <div>
                <Label htmlFor="org-name" className="text-foreground/90 block mb-1.5 text-xs font-semibold">Organization name <RequiredAsterisk isValid={!!realmName.trim()} /></Label>
                <Input
                    id="org-name"
                    placeholder="Enter name"
                    value={realmName}
                    onChange={(e) => setRealmName(e.target.value)}
                    className="h-10 bg-surface-subtle border-border"
                    required
                />
            </div>

            <div>
                <Label htmlFor="domain" className="text-foreground/90 block mb-1.5 text-xs font-semibold">Domain pattern <RequiredAsterisk isValid={!!normalizedDomain} /></Label>
                <Input
                    id="domain"
                    placeholder="company.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="h-10 bg-surface-subtle border-border"
                    aria-invalid={!normalizedDomain}
                    required
                />
            </div>

            <div>
                <Label htmlFor="admin-email" className="text-foreground/90 block mb-1.5 text-xs font-semibold">Admin email <RequiredAsterisk isValid={isAdminEmailValid} /></Label>
                <Input
                    id="admin-email"
                    placeholder="admin@company.com"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="h-10 bg-surface-subtle border-border"
                    aria-invalid={!!normalizedEmail && !isAdminEmailValid}
                    required
                />
                {!!normalizedEmail && !isAdminEmailFormatValid && (
                    <p className="mt-1 text-xs text-destructive">
                        Please enter a valid admin email address.
                    </p>
                )}
                {!!normalizedEmail && isAdminEmailFormatValid && !isAdminEmailDomainMatching && (
                    <p className="mt-1 text-xs text-destructive">
                        Admin email domain must match organization domain ({normalizedDomain}).
                    </p>
                )}
            </div>
        </div>
    )
}
