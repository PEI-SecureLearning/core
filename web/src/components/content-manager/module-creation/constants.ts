/* ─────────────────────────────────────────────────────────
   Module Creation — constants, factories, option arrays
───────────────────────────────────────────────────────── */
import type { Choice, Question, Section } from './types'

export const uid = () => Math.random().toString(36).slice(2)

export const CATEGORY_OPTIONS = [
    'Programming', 'Backend', 'Frontend', 'Security', 'DevOps', 'Data', 'Cloud', 'Other',
]

export const TRUE_FALSE_CHOICES: Choice[] = [
    { id: 'tf-t', text: 'True',  isCorrect: true  },
    { id: 'tf-f', text: 'False', isCorrect: false },
]

export function emptyQuestion(): Question {
    return {
        id: uid(),
        type: 'multiple_choice',
        text: '',
        choices: [
            { id: uid(), text: '', isCorrect: false },
            { id: uid(), text: '', isCorrect: false },
        ],
        answer: '',
    }
}

export function emptySection(): Section {
    return { id: uid(), title: 'New Section', collapsed: false, blocks: [] }
}

export const DIFFICULTY_COLORS: Record<'Beginner' | 'Intermediate' | 'Advanced', string> = {
    Beginner:     'bg-green-100 text-green-700 border-green-300',
    Intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Advanced:     'bg-red-100 text-red-700 border-red-300',
}

/** Shared input field class */
export const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300/50'

/* ── Markdown toolbar options ── */
export const MD_HEADING_OPTIONS = [
    { label: 'H1 — Title',       insert: '\n# Heading\n'    },
    { label: 'H2 — Section',     insert: '\n## Heading\n'   },
    { label: 'H3 — Subsection',  insert: '\n### Heading\n'  },
]

export const MD_LIST_OPTIONS = [
    { label: '• Bullet list',    insert: '\n- Item\n- Item\n'    },
    { label: '1. Numbered list', insert: '\n1. Item\n2. Item\n'  },
]

export const MD_INSERT_OPTIONS = [
    { label: '``` Code block',  insert: '\n```\ncode here\n```\n'                                                                       },
    { label: '❝  Blockquote',   insert: '\n> Quoted text\n'                                                                            },
    { label: '⊟  Table',        insert: '\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n'         },
    { label: '─  Divider',      insert: '\n---\n'                                                                                      },
]

export const MD_INLINE_ACTIONS = [
    { label: 'B',      insert: '**bold**',   title: 'Bold',          labelClass: 'font-bold'      },
    { label: 'I',      insert: '_italic_',   title: 'Italic',        labelClass: 'italic'         },
    { label: 'Strike', insert: '~~strike~~', title: 'Strikethrough', labelClass: 'line-through'   },
    { label: 'Code',   insert: '`code`',     title: 'Inline code',   labelClass: 'font-mono'      },
]
