/* ─────────────────────────────────────────────────────────
   Module Creation — pure utility functions
───────────────────────────────────────────────────────── */
import type { Block, ModuleFormData, QuestionBlock } from './types'

export function totalBlocks(d: ModuleFormData): number {
    return d.sections.reduce((acc, s) => acc + s.blocks.length, 0)
}

export function totalQuestions(d: ModuleFormData): number {
    return d.sections.reduce((acc, s) =>
        acc + s.blocks.filter(b => b.kind === 'question').length, 0)
}

/**
 * A question block is valid when:
 *  - question text is filled
 *  - for multiple_choice: ≥ 2 choices, all choice texts filled, one marked correct
 *  - for true_false:      always valid (choices are fixed)
 *  - for short_answer:    always valid (free-text, no choices required)
 */
export function isQuestionValid(block: QuestionBlock): boolean {
    const q = block.question
    if (!q.text.trim()) return false
    if (q.type === 'true_false' || q.type === 'short_answer') return true
    return (
        q.choices.length >= 2 &&
        q.choices.every(c => c.text.trim() !== '') &&
        q.choices.some(c => c.isCorrect)
    )
}

function isBlockValid(b: Block): boolean {
    if (b.kind === 'text')     return b.content.trim() !== ''
    if (b.kind === 'question') return isQuestionValid(b)
    return true   // rich_content: no text constraint
}

/** All question blocks across all sections must pass their constraints. */
export function allQuestionsValid(d: ModuleFormData): boolean {
    return d.sections.every(s => s.blocks.every(isBlockValid))
}

/** Compute a 0–100 completion score */
export function calcCompletion(d: ModuleFormData): number {
    const checks = [
        !!d.title.trim(),
        !!d.category,
        !!d.description.trim(),
        !!d.estimatedTime.trim(),
        d.sections.length > 0,
        totalBlocks(d) > 0,
        !!d.coverImage,
        allQuestionsValid(d),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

/**
 * Markdown → HTML
 * Supports: headings, bold, italic, strikethrough, inline-code,
 * fenced code blocks, blockquotes, tables, ordered/unordered lists, hr, paragraphs.
 */
export function renderMarkdown(md: string): string {
    // Escape HTML entities first
    let out = md
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')

    // Fenced code blocks ```lang\n...\n```
    out = out.replaceAll(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
        `<pre class="bg-slate-900 text-green-300 rounded-lg px-4 py-3 my-3 overflow-x-auto text-xs font-mono whitespace-pre">${
            lang ? `<span class="text-slate-500 text-[10px] uppercase block mb-1">${lang}</span>` : ''
        }${code.trim()}</pre>`)

    // Blockquotes (lines starting with >)
    out = out.replaceAll(/^&gt; (.+)$/gm,
        '<blockquote class="border-l-4 border-purple-300 pl-3 italic text-slate-500 my-2">$1</blockquote>')

    // Horizontal rule
    out = out.replaceAll(/^---$/gm,
        '<hr class="my-4 border-slate-200" />')

    // Tables: | col | col | with separator row | --- | --- |
    out = out.replaceAll(
        /^\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm,
        (_m, header, rows) => {
            const thCells = header.split('|').filter((c: string) => c.trim()).map((c: string) =>
                `<th class="px-3 py-2 text-left text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200">${c.trim()}</th>`
            ).join('')
            const bodyRows = rows.trim().split('\n').map((row: string) => {
                const tds = row.split('|').filter((c: string) => c.trim()).map((c: string) =>
                    `<td class="px-3 py-2 text-xs text-slate-700 border border-slate-200">${c.trim()}</td>`
                ).join('')
                return `<tr>${tds}</tr>`
            }).join('')
            return `<div class="overflow-x-auto my-3"><table class="w-full border-collapse text-sm"><thead><tr>${thCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`
        }
    )

    // Headings
    out = out
        .replaceAll(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-1 text-slate-800">$1</h3>')
        .replaceAll(/^## (.+)$/gm,  '<h2 class="text-lg font-bold mt-5 mb-2 text-slate-800">$1</h2>')
        .replaceAll(/^# (.+)$/gm,   '<h1 class="text-xl font-bold mt-6 mb-2 text-slate-900">$1</h1>')

    // Inline: bold, italic, strikethrough, inline-code
    out = out
        .replaceAll(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
        .replaceAll(/~~(.+?)~~/g,     '<del class="text-slate-400 line-through">$1</del>')
        .replaceAll(/_(.+?)_/g,       '<em class="italic">$1</em>')
        .replaceAll(/`([^`]+)`/g,     '<code class="bg-slate-100 text-purple-700 rounded px-1 py-0.5 text-[12px] font-mono">$1</code>')

    // Lists
    out = out
        .replaceAll(/^- (.+)$/gm,     '<li class="ml-5 list-disc text-slate-700 leading-relaxed">$1</li>')
        .replaceAll(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal text-slate-700 leading-relaxed">$1</li>')

    // Plain paragraphs (lines not already wrapped in an HTML tag)
    out = out.replaceAll(/^(?!<[a-zA-Z/])(.+)$/gm,
        '<p class="text-slate-700 leading-relaxed my-1">$1</p>')

    // Collapse multiple blank lines
    out = out.replaceAll(/\n{2,}/g, '\n')

    return out
}
