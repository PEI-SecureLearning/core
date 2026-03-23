import React, { createContext, useContext } from 'react'

export type AccentColor = 'primary' | 'purple' | 'teal'

export interface ModuleCreationTheme {
    // Section styles
    grip: string
    badge: string
    badgeActive: string
    border: string
    borderHover: string
    borderActive: string
    chevron: string
    inputBorder: string
    inputRing: string
    pencil: string
    dragBorder: string
    dragBadge: string
    dragGrip: string

    // Block/Menu styles
    addText: string
    addHover: string
    menuIcon: string
    hover: string
    hoverText: string
}

export const THEMES: Record<AccentColor, ModuleCreationTheme> = {
    primary: {
        grip: 'hover:text-primary/60',
        badge: 'text-accent-secondary bg-primary/5 border border-primary/20',
        badgeActive: 'text-primary-foreground bg-primary border border-primary',
        border: 'border border-border',
        borderHover: 'hover:border-primary/30',
        borderActive: 'border-2 border-primary shadow-md',
        chevron: 'hover:text-primary',
        inputBorder: 'border-primary/30',
        inputRing: 'focus:ring-primary/40',
        pencil: 'group-hover:text-accent-secondary',
        dragBorder: 'border-primary',
        dragBadge: 'text-primary-foreground bg-primary border border-primary',
        dragGrip: 'text-accent-secondary',

        addText: 'text-primary',
        addHover: 'hover:text-primary/80',
        menuIcon: 'text-primary',
        hover: 'hover:bg-primary/5',
        hoverText: 'hover:text-primary/80',
    },
    purple: {
        grip: 'hover:text-primary/60',
        badge: 'text-primary bg-primary/5 border border-primary/20',
        badgeActive: 'text-primary-foreground bg-primary border border-primary',
        border: 'border border-border',
        borderHover: 'hover:border-primary/30',
        borderActive: 'border-2 border-primary shadow-md',
        chevron: 'hover:text-primary',
        inputBorder: 'border-primary/30',
        inputRing: 'focus:ring-primary/40',
        pencil: 'group-hover:text-primary/60',
        dragBorder: 'border-primary',
        dragBadge: 'text-primary-foreground bg-primary border border-primary',
        dragGrip: 'text-primary/60',

        addText: 'text-primary',
        addHover: 'hover:text-primary/80',
        menuIcon: 'text-primary',
        hover: 'hover:bg-primary/5',
        hoverText: 'hover:text-primary/80',
    },
    teal: {
        grip: 'hover:text-accent-secondary/60',
        badge: 'text-accent-secondary bg-accent-secondary/5 border border-accent-secondary/20',
        badgeActive: 'text-primary-foreground bg-accent-secondary border border-accent-secondary',
        border: 'border border-border',
        borderHover: 'hover:border-accent-secondary/30',
        borderActive: 'border-2 border-accent-secondary shadow-md',
        chevron: 'hover:text-accent-secondary',
        inputBorder: 'border-accent-secondary/30',
        inputRing: 'focus:ring-accent-secondary/40',
        pencil: 'group-hover:text-accent-secondary/60',
        dragBorder: 'border-accent-secondary',
        dragBadge: 'text-primary-foreground bg-accent-secondary border border-accent-secondary',
        dragGrip: 'text-accent-secondary/60',

        addText: 'text-accent-secondary',
        addHover: 'hover:text-accent-secondary/80',
        menuIcon: 'text-accent-secondary',
        hover: 'hover:bg-accent-secondary/5',
        hoverText: 'hover:text-accent-secondary/80',
    },
}

const ThemeContext = createContext<AccentColor>('primary')

export function ThemeProvider({ children, accent }: { readonly children: React.ReactNode, readonly accent: AccentColor }) {
    return <ThemeContext.Provider value={accent}>{children}</ThemeContext.Provider>
}

export function useModuleTheme() {
    const accent = useContext(ThemeContext)
    return {
        accent,
        theme: THEMES[accent],
    }
}
