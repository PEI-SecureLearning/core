import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RequiredAsterisk from '@/components/shared/RequiredAsterisk'

interface TenantFormUsersProps {
    userCount: string
    setUserCount: (value: string) => void
    bundle: string
    setBundle: (value: string) => void
}

export function TenantFormUsers({
    userCount, setUserCount,
    bundle, setBundle
}: Readonly<TenantFormUsersProps>) {
    return (
        <div className="grid grid-cols-2 gap-6">
            <div className="h-20">
                <Label htmlFor="users" className="text-foreground/90 block mb-2">Number of users <RequiredAsterisk isValid={!!userCount} /></Label>
                <Input
                    id="users"
                    type="number"
                    placeholder="0"
                    value={userCount}
                    onChange={(e) => setUserCount(e.target.value)}
                    className="h-12 bg-surface-subtle border-border"
                    required
                />
            </div>
            <div className="h-20">
                <Label htmlFor="bundle" className="text-foreground/90 block mb-2">Bundle pack <span className="text-muted-foreground/70 font-normal">Optional</span></Label>
                <select
                    id="bundle"
                    className="flex h-12 w-full rounded-md border border-border bg-surface-subtle px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={bundle}
                    onChange={(e) => setBundle(e.target.value)}
                >
                    <option value="">Select a bundle</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                </select>
            </div>
        </div>
    )
}
