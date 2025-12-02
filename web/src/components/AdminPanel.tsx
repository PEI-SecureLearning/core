import { useState } from 'react'
import axios from 'axios'
import { useKeycloak } from '@react-keycloak/web'
import { TenantForm } from './admin/TenantForm'
import { PreviewPanel } from './admin/PreviewPanel'

export function AdminPanel() {
    const { keycloak } = useKeycloak()
    const [realmName, setRealmName] = useState('')
    const [domain, setDomain] = useState('')
    const [adminEmail, setAdminEmail] = useState('')
    const [userCount, setUserCount] = useState('')
    const [bundle, setBundle] = useState('')
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
                    // Sending extra fields even if backend doesn't support them yet
                    adminEmail,
                    userCount,
                    bundle,
                    features
                },
                {
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`,
                    },
                }
            )
            alert('Realm created successfully!')
            // Reset form
            setRealmName('')
            setDomain('')
            setAdminEmail('')
            setUserCount('')
            setBundle('')
        } catch (error) {
            console.error('Error creating realm:', error)
            alert('Failed to create realm')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-full w-full bg-gray-50 flex justify-center items-center">


            <div className="flex h-8/10 gap-6">
                <TenantForm
                    realmName={realmName}
                    setRealmName={setRealmName}
                    domain={domain}
                    setDomain={setDomain}
                    adminEmail={adminEmail}
                    setAdminEmail={setAdminEmail}
                    userCount={userCount}
                    setUserCount={setUserCount}
                    bundle={bundle}
                    setBundle={setBundle}
                    features={features}
                    setFeatures={setFeatures}
                    handleSubmit={handleSubmit}
                />

                <PreviewPanel
                    realmName={realmName}
                    bundle={bundle}
                    features={features}
                    isLoading={isLoading}
                    handleSubmit={handleSubmit}
                />
            </div>
        </div>
    )
}
