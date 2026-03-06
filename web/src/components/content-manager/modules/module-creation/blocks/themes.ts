export type BlockAccent = 'purple' | 'teal'

export interface BlockAccentTheme {
    addText:   string
    addHover:  string
    menuIcon:  string
    hover:     string
    hoverText: string
}

export const BLOCK_THEMES: Record<BlockAccent, BlockAccentTheme> = {
    purple: {
        addText:   'text-purple-500',
        addHover:  'hover:text-purple-700',
        menuIcon:  'text-purple-500',
        hover:     'hover:bg-purple-50',
        hoverText: 'hover:text-purple-700',
    },
    teal: {
        addText:   'text-teal-500',
        addHover:  'hover:text-teal-700',
        menuIcon:  'text-teal-500',
        hover:     'hover:bg-teal-50',
        hoverText: 'hover:text-teal-700',
    },
}
