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
        grip: 'hover:text-purple-400',
        badge: 'text-purple-600 bg-purple-50 border border-purple-200',
        badgeActive: 'text-white bg-purple-500 border border-purple-500',
        border: 'border border-slate-200',
        borderHover: 'hover:border-purple-300',
        borderActive: 'border-2 border-purple-500 shadow-md',
        chevron: 'hover:text-purple-600',
        inputBorder: 'border-purple-300',
        inputRing: 'focus:ring-purple-300/40',
        pencil: 'group-hover:text-purple-400',
        dragBorder: 'border-purple-500',
        dragBadge: 'text-white bg-purple-500 border border-purple-500',
        dragGrip: 'text-purple-400',

        addText: 'text-purple-500',
        addHover: 'hover:text-purple-700',
        menuIcon: 'text-purple-500',
        hover: 'hover:bg-purple-50',
        hoverText: 'hover:text-purple-700',
    },
    teal: {
        grip: 'hover:text-teal-400',
        badge: 'text-teal-600 bg-teal-50 border border-teal-200',
        badgeActive: 'text-white bg-teal-500 border border-teal-500',
        border: 'border border-slate-200',
        borderHover: 'hover:border-teal-300',
        borderActive: 'border-2 border-teal-500 shadow-md',
        chevron: 'hover:text-teal-600',
        inputBorder: 'border-teal-300',
        inputRing: 'focus:ring-teal-300/40',
        pencil: 'group-hover:text-teal-400',
        dragBorder: 'border-teal-500',
        dragBadge: 'text-white bg-teal-500 border border-teal-500',
        dragGrip: 'text-teal-400',

        addText: 'text-teal-500',
        addHover: 'hover:text-teal-700',
        menuIcon: 'text-teal-500',
        hover: 'hover:bg-teal-50',
        hoverText: 'hover:text-teal-700',
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
