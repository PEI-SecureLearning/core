import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TenantFormUsersProps {
    userCount: string
    setUserCount: (value: string) => void
    bundle: string
    setBundle: (value: string) => void
}

export function TenantFormUsers({
    userCount, setUserCount,
    bundle, setBundle
}: TenantFormUsersProps) {
    return (
        <div className="grid grid-cols-2 gap-6">
            <div className="h-20">
                <Label htmlFor="users" className="text-gray-700 block mb-2">Number of users<span className="text-red-500">*</span></Label>
                <Input
                    id="users"
                    type="number"
                    placeholder="0"
                    value={userCount}
                    onChange={(e) => setUserCount(e.target.value)}
                    className="h-12 bg-gray-50 border-gray-200"
                    required
                />
            </div>
            <div className="h-20">
                <Label htmlFor="bundle" className="text-gray-700 block mb-2">Bundle pack <span className="text-gray-400 font-normal">Optional</span></Label>
                <select
                    id="bundle"
                    className="flex h-12 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
