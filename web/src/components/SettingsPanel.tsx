import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useThemeTransition } from '@/lib/useThemeTransition'

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemeOption = {
    value: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    description: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const themeOptions: ThemeOption[] = [
    {
        value: 'light',
        label: 'Light',
        icon: Sun,
        description: 'Clean white background, optimised for bright environments.',
    },
    {
        value: 'dark',
        label: 'Dark',
        icon: Moon,
        description: 'Dark background, easier on the eyes in low-light settings.',
    },
    {
        value: 'system',
        label: 'System',
        icon: Monitor,
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
            <div className="max-w-2xl mx-auto px-6 py-10">

                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Appearance</h1>
                    <p className="text-sm text-muted-foreground mt-1">Choose how the interface looks to you.</p>
                </div>

                {/* Theme picker */}
                {mounted ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {themeOptions.map(({ value, label, icon: Icon, description: desc }) => {
                            const isActive = theme === value
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setTheme(value)}
                                    aria-pressed={isActive}
                                    className={`
                                        relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left
                                        transition-all duration-200 cursor-pointer
                                        ${isActive
                                            ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/30 bg-[#7C3AED]/10'
                                            : 'border-border hover:border-[#7C3AED]/40 hover:bg-surface-subtle'
                                        }
                                    `}
                                >
                                    <span className={`
                                        inline-flex items-center justify-center rounded-lg p-2 transition-colors duration-200
                                        ${isActive ? 'bg-[#7C3AED] text-white' : 'bg-surface text-muted-foreground'}
                                    `}>
                                        <Icon className="h-4 w-4" />
                                    </span>

                                    <div>
                                        <p className={`text-sm font-medium ${isActive ? 'text-[#A78BFA]' : 'text-foreground'}`}>
                                            {label}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                                            {desc}
                                        </p>
                                    </div>

                                    {isActive && (
                                        <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#7C3AED]" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[0, 1, 2].map((i) => (
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
