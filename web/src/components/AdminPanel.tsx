import { useState } from 'react'
import axios from 'axios'
import { useKeycloak } from '@react-keycloak/web'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function AdminPanel() {
    const { keycloak } = useKeycloak()
    const [realmName, setRealmName] = useState('')
    const [domain, setDomain] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await axios.post(
                `http://localhost:8000/api/realms`,
                {
                    name: realmName,
                    domain: domain
                },
                {
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`,
                    },
                }
            )
            alert('Realm created successfully!')
            setRealmName('')
            setDomain('')
        } catch (error) {
            console.error('Error creating realm:', error)
            alert('Failed to create realm')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-[50vh] p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Create Realm</CardTitle>
                    <CardDescription>Enter the name and domain of the new realm.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="realm-name">Realm Name</Label>
                            <Input
                                id="realm-name"
                                placeholder="Enter realm name..."
                                value={realmName}
                                onChange={(e) => setRealmName(e.target.value)}
                                required
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain">Domain</Label>
                            <Input
                                id="domain"
                                placeholder="Enter domain (e.g. company.com)..."
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                required
                                className="w-full"
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Realm'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
