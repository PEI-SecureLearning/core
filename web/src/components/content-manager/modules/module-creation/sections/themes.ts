export type AccentColor = 'purple' | 'teal'

export interface SectionTheme {
    grip:         string
    badge:        string
    badgeActive:  string
    border:       string
    borderHover:  string
    borderActive: string
    chevron:      string
    inputBorder:  string
    inputRing:    string
    pencil:       string
    dragBorder:   string
    dragBadge:    string
    dragGrip:     string
}

export const THEMES: Record<AccentColor, SectionTheme> = {
    purple: {
        grip:         'hover:text-purple-400',
        badge:        'text-purple-600 bg-purple-50 border border-purple-200',
        badgeActive:  'text-white bg-purple-500 border border-purple-500',
        border:       'border border-slate-200',
        borderHover:  'hover:border-purple-300',
        borderActive: 'border-2 border-purple-500 shadow-md',
        chevron:      'hover:text-purple-600',
        inputBorder:  'border-purple-300',
        inputRing:    'focus:ring-purple-300/40',
        pencil:       'group-hover:text-purple-400',
        dragBorder:   'border-purple-500',
        dragBadge:    'text-white bg-purple-500 border border-purple-500',
        dragGrip:     'text-purple-400',
    },
    teal: {
        grip:         'hover:text-teal-400',
        badge:        'text-teal-600 bg-teal-50 border border-teal-200',
        badgeActive:  'text-white bg-teal-500 border border-teal-500',
        border:       'border border-slate-200',
        borderHover:  'hover:border-teal-300',
        borderActive: 'border-2 border-teal-500 shadow-md',
        chevron:      'hover:text-teal-600',
        inputBorder:  'border-teal-300',
        inputRing:    'focus:ring-teal-300/40',
        pencil:       'group-hover:text-teal-400',
        dragBorder:   'border-teal-500',
        dragBadge:    'text-white bg-teal-500 border border-teal-500',
        dragGrip:     'text-teal-400',
    },
}
