import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useThemeTransition } from '@/lib/useThemeTransition'
import { ThemeCard } from '@/components/shared/ThemeCard'
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
    const { theme, resolvedTheme } = useTheme()
    const setTheme = useThemeTransition()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    return (
        <div className="h-full w-full overflow-y-auto bg-background text-foreground">
            <div className="max-w-3xl mx-auto px-6 py-10">

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
