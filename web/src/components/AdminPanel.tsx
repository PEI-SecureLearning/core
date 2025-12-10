import { useState } from 'react'
import axios from 'axios'
import { useKeycloak } from '@react-keycloak/web'
import { TenantForm } from './admin/TenantForm'
import { PreviewPanel } from './admin/PreviewPanel'

export function CreateTenantPage() {
    const { keycloak } = useKeycloak()
    const [realmName, setRealmName] = useState('')
    const [domain, setDomain] = useState('')
    const [adminEmail, setAdminEmail] = useState('')
    const [features, setFeatures] = useState({
        phishing: true,
        lms: true
    })
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await axios.post(
                `http://localhost:8000/api/realms`,
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
            alert('Realm created successfully!')
            setRealmName('')
            setDomain('')
            setAdminEmail('')
        } catch (error) {
            console.error('Error creating realm:', error)
            alert('Failed to create realm')
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
                        handleSubmit={handleSubmit}
                    />
                </div>

                {/* Fixed preview panel - doesn't scroll */}
                <div className="flex-shrink-0">
                    <PreviewPanel
                        realmName={realmName}
                        features={features}
                        isLoading={isLoading}
                        handleSubmit={handleSubmit}
                    />
                </div>
            </div>
        </div>
    )
}
