import type React from 'react'

export type ThemeCardProps = {
    value: string
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    accentColor: string
    isActive: boolean
    onSelect: (value: string) => void
}

export function ThemeCard({
    value,
    label,
    description,
    icon: Icon,
    accentColor,
    isActive,
    onSelect,
}: ThemeCardProps) {
    const accentBg = `${accentColor}1A`
    const accentRing = `${accentColor}4D`

    return (
        <button
            type="button"
            onClick={() => onSelect(value)}
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
                transition-all duration-200 cursor-pointer
                ${isActive
                    ? 'border-transparent'
                    : 'border-border hover:border-border/80 hover:bg-surface-subtle'
                }
            `}
        >
            <span
                style={
                    isActive
                        ? { backgroundColor: accentColor }
                        : undefined
                }
                className={`
                    inline-flex items-center justify-center rounded-lg p-2 transition-colors duration-200
                    ${isActive ? 'text-white' : 'bg-surface text-muted-foreground'}
                `}
            >
                <Icon className="h-4 w-4" />
            </span>

            <div>
                <p
                    style={isActive ? { color: accentColor } : undefined}
                    className={`text-sm font-medium ${isActive ? '' : 'text-foreground'}`}
                >
                    {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {description}
                </p>
            </div>

            {isActive && (
                <span
                    style={{ backgroundColor: accentColor }}
                    className="absolute top-3 right-3 h-2 w-2 rounded-full"
                />
            )}
        </button>
    )
}
