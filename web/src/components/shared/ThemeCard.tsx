import { memo } from 'react'
import type React from 'react'

export type ThemeCardProps = {
    value: string
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    accentColor: string
    isActive: boolean
    onSelect: (value: string, event?: React.MouseEvent) => void
}

export const ThemeCard = memo(function ThemeCard({
    value,
    label,
    icon: Icon,
    accentColor,
    isActive,
    onSelect,
}: Omit<ThemeCardProps, 'description'>) {
    // These now refer to global CSS variables defined in globals.css
    const accentBg = `var(--theme-${value}-bg)`
    const accentRing = `var(--theme-${value}-ring)`
    const accentPrimary = `var(--theme-${value}-primary)`

    return (
        <button
            type="button"
            onClick={(e) => onSelect(value, e)}
            aria-pressed={isActive}
            style={
                isActive
                    ? {
                        borderColor: accentColor,
                        boxShadow: `0 0 0 2px ${accentRing}`,
                        backgroundColor: accentBg,
                    }
                    : undefined
            }
            className={`
                relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left
                transition-all duration-300 cursor-pointer group
                ${isActive
                    ? 'border-transparent'
                    : 'border-border hover:border-primary/30 hover:bg-surface-subtle shadow-sm hover:shadow-md'
                }
            `}
        >
            <span
                className={`
                    inline-flex items-center justify-center rounded-lg p-2 transition-all duration-300
                    border border-border bg-surface text-muted-foreground
                    group-hover:border-primary/20
                    ${isActive ? '!text-white !border-transparent' : ''}
                `}
                style={isActive ? { backgroundColor: accentPrimary, borderColor: accentPrimary } : undefined}
            >
                <Icon className="h-4 w-4" />
            </span>

            <div>
                <p
                    style={isActive ? { color: accentPrimary } : undefined}
                    className={`text-sm font-medium transition-colors duration-300 ${isActive ? '' : 'text-foreground'}`}
                >
                    {label}
                </p>
            </div>

            {isActive && (
                <span
                    style={{ backgroundColor: accentPrimary }}
                    className="absolute top-3 right-3 h-2 w-2 rounded-full animate-in zoom-in duration-300"
                />
            )}
        </button>
    )
})
