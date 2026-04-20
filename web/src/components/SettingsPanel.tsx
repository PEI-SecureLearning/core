import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, EyeOff, Mail, UserRound, KeyRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import { useThemeTransition } from '@/lib/useThemeTransition'
import { ThemeCard } from '@/components/shared/ThemeCard'
import { Button } from '@/components/ui/button'
import { currentUserApi, type CurrentUserProfile } from '@/services/currentUserApi'
import type { ThemeCardProps } from '@/components/shared/ThemeCard'

// ─── Constants ────────────────────────────────────────────────────────────────

type ThemeOption = Omit<ThemeCardProps, 'isActive' | 'onSelect'>

const themeOptions: ThemeOption[] = [
    {
        value: 'light',
        label: 'Light',
        icon: Sun,
        accentColor: 'var(--theme-light-primary)',
        description: 'Clean white background, optimised for bright environments.',
    },
    {
        value: 'dark',
        label: 'Dark',
        icon: Moon,
        accentColor: 'var(--theme-dark-primary)',
        description: 'Dark background, easier on the eyes in low-light settings.',
    },
    {
        value: 'deuteranopia',
        label: 'Deuteranopia',
        icon: EyeOff,
        accentColor: 'var(--theme-deuteranopia-primary)',
        description: 'Blue accent palette — optimised for green-blind users.',
    },
    {
        value: 'protanopia',
        label: 'Protanopia',
        icon: EyeOff,
        accentColor: 'var(--theme-protanopia-primary)',
        description: 'Teal accent palette — optimised for red-blind users.',
    },
    {
        value: 'tritanopia',
        label: 'Tritanopia',
        icon: EyeOff,
        accentColor: 'var(--theme-tritanopia-primary)',
        description: 'Red/Cyan accent palette — optimised for blue-blind users.',
    },
    {
        value: 'system',
        label: 'System',
        icon: Monitor,
        accentColor: 'var(--theme-light-primary)',
        description: 'Automatically follows your operating-system preference.',
    },
]

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsPanel() {
    const { keycloak } = useKeycloak()
    const { theme, resolvedTheme } = useTheme()
    const setTheme = useThemeTransition()
    const [mounted, setMounted] = useState(false)
    const [profile, setProfile] = useState<CurrentUserProfile | null>(null)
    const [profileLoading, setProfileLoading] = useState(true)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [isRedirectingToPasswordFlow, setIsRedirectingToPasswordFlow] = useState(false)

    useEffect(() => setMounted(true), [])

    useEffect(() => {
        let cancelled = false

        const loadProfile = async () => {
            if (!keycloak.authenticated || !keycloak.token) {
                setProfile(null)
                setProfileLoading(false)
                return
            }

            setProfileLoading(true)
            setProfileError(null)

            try {
                await keycloak.updateToken(30)
                const data = await currentUserApi.getCurrentUser()
                if (!cancelled) {
                    setProfile(data)
                }
            } catch (error) {
                console.error("Failed to load current user profile", error)
                if (!cancelled) {
                    setProfileError("Failed to load your account details.")
                }
            } finally {
                if (!cancelled) {
                    setProfileLoading(false)
                }
            }
        }

        loadProfile().catch(() => undefined)

        return () => {
            cancelled = true
        }
    }, [keycloak.authenticated, keycloak.token])

    const handleChangePassword = async () => {
        setIsRedirectingToPasswordFlow(true)

        try {
            await keycloak.login({
                action: 'UPDATE_PASSWORD',
                redirectUri: window.location.href,
            })
        } catch (error) {
            console.error("Failed to start password change flow", error)
            setProfileError("Failed to open Keycloak password change.")
            setIsRedirectingToPasswordFlow(false)
        }
    }

    const displayName =
        profile?.fullName ||
        [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
        profile?.username ||
        'Current user'

    return (
        <div className="h-full w-full overflow-y-auto bg-background text-foreground">
            <div className="max-w-3xl mx-auto px-6 py-10">
                <div id="account" className="mb-10 scroll-mt-6">
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account</h1>
                        <p className="text-sm text-muted-foreground mt-1">Your profile</p>
                    </div>

                    {profileLoading ? (
                        <div className="space-y-3">
                            <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="h-12 rounded-xl bg-muted animate-pulse" />
                                <div className="h-12 rounded-xl bg-muted animate-pulse" />
                                <div className="h-12 rounded-xl bg-muted animate-pulse" />
                                <div className="h-12 rounded-xl bg-muted animate-pulse" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => void handleChangePassword()}
                                    disabled={isRedirectingToPasswordFlow}
                                    className="sm:self-start"
                                >
                                    <KeyRound className="h-4 w-4" />
                                    {isRedirectingToPasswordFlow ? "Redirecting..." : "Change password"}
                                </Button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-border bg-background px-4 py-3">
                                    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                        <UserRound className="h-3.5 w-3.5" />
                                        First name
                                    </div>
                                    <p className="text-sm font-medium text-foreground">{profile?.firstName || "Not available"}</p>
                                </div>

                                <div className="rounded-xl border border-border bg-background px-4 py-3">
                                    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                        <UserRound className="h-3.5 w-3.5" />
                                        Last name
                                    </div>
                                    <p className="text-sm font-medium text-foreground">{profile?.lastName || "Not available"}</p>
                                </div>

                                <div className="rounded-xl border border-border bg-background px-4 py-3">
                                    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                        <UserRound className="h-3.5 w-3.5" />
                                        Username
                                    </div>
                                    <p className="text-sm font-medium text-foreground">{profile?.username || "Not available"}</p>
                                </div>

                                <div className="rounded-xl border border-border bg-background px-4 py-3">
                                    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5" />
                                        Email
                                    </div>
                                    <p className="text-sm font-medium text-foreground">{profile?.email || "Not available"}</p>
                                </div>
                            </div>

                            {profileError && (
                                <p className="text-sm text-rose-500">{profileError}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Appearance</h1>
                    <p className="text-sm text-muted-foreground mt-1">Choose how the interface looks to you.</p>
                </div>

                {mounted ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {themeOptions.map((option) => (
                            <ThemeCard
                                key={option.value}
                                {...option}
                                isActive={theme === option.value}
                                onSelect={setTheme}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-32 rounded-xl border border-border bg-surface animate-pulse" />
                        ))}
                    </div>
                )}

                {mounted && (
                    <p className="text-xs text-muted-foreground mt-3">
                        Currently resolved to:{' '}
                        <span className="font-medium capitalize text-foreground">{resolvedTheme}</span>
                    </p>
                )}

            </div>
        </div>
    )
}
