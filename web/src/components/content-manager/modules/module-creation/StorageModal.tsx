import { useState, useRef } from 'react'
import { FileJson, X, Bot } from 'lucide-react'
import { toast } from 'sonner'

import type { ModuleFormData } from './types'

const PROMPT_GUIDE_CONTENT = `# SecureLearning Module JSON Schema & Prompt Guide

This document defines the exact JSON structure for SecureLearning training modules. Use this guide to generate valid, importable modules with an LLM.

## 🏗 High-Level Structure

The root object is a \`ModuleFormData\`.

| Field | Type | Description |
| :--- | :--- | :--- |
| \`title\` | \`string\` | Human-readable title. Keep it concise. |
| \`category\` | \`string\` | One of: \`General Awareness\`, \`Phishing\`, \`Password Security\`, \`Data Protection\`, \`Network Security\`, \`Physical Security\`. |
| \`description\` | \`string\` | A multi-line summary of the module's goals. |
| \`estimatedTime\` | \`string\` | Estimated duration as a string, e.g., \`"15 minutes"\`. |
| \`difficulty\` | \`string\` | Exactly one of: \`Easy\`, \`Medium\`, \`Hard\`. |
| \`sections\` | \`Array<Section>\` | The core content divided into logical chapters. |

---

## 📂 The Section Object

Sections represent pages or chapters in the module.

- \`id\`: A unique UUID string (e.g., \`crypto.randomUUID()\`).
- \`title\`: Title of the section.
- \`blocks\`: An array of \`Block\` objects (ordered).
- \`requireCorrectAnswers\` (boolean, optional): If \`true\`, the user cannot leave the section until all questions are answered correctly.
- \`isOptional\` (boolean, optional): If \`true\`, the section can be skipped in the UI.
- \`minTimeSpent\` (number, optional): Minimum seconds the user must stay on this section.

---

## 🧩 The Block Types (\`kind\`)

Every block must have a \`kind\` field.

### 1. Text Block (\`kind: "text"\`)
Content is rendered as GitHub Flavored Markdown.
- \`id\`: Unique UUID.
- \`content\`: Markdown string. Support for headers (\`#\`), bold, lists, and code blocks.

### 2. Question Block (\`kind: "question"\`)
Interactive knowledge checks.
- \`id\`: Unique UUID.
- \`question\`:
    - \`id\`: Unique UUID.
    - \`type\`: \`multiple_choice\`, \`true_false\`, or \`short_answer\`.
    - \`text\`: The question prompt.
    - \`choices\`: (Required for \`multiple_choice\` and \`true_false\`)
        - \`id\`: Unique UUID.
        - \`text\`: Answer text.
        - \`isCorrect\`: Boolean. Exactly one should be \`true\` for standard questions.
    - \`answer\`: (Required for \`short_answer\`) The exact expected string or a regex pattern.

### 3. Rich Content Block (\`kind: "rich_content"\`)
External media from the system library.
- \`id\`: Unique UUID.
- \`mediaType\`: \`image\`, \`video\`, \`audio\`, or \`file\`.
- \`contentId\`: The \`content_piece_id\` from the library (ignore/leave empty if generating a template).
- \`caption\`: Descriptive text for accessibility and UI.

---

## 💡 LLM Generation Rules

1. **UUIDs**: Always generate unique, valid v4 UUIDs for every \`id\` field.
2. **Markdown**: Use rich formatting in text blocks to make the module engaging.
3. **Escaping**: Ensure all strings are properly JSON-escaped (especially nested quotes in Markdown).
4. **Validation**: Ensure \`multiple_choice\` questions have at least one \`isCorrect: true\` choice.

---

## 🚀 Comprehensive Example

\`\`\`json
{
  "title": "Mastering MFA (Multi-Factor Authentication)",
  "category": "Password Security",
  "description": "Learn why passwords aren't enough and how to use MFA effectively.",
  "estimatedTime": "10 minutes",
  "difficulty": "Medium",
  "sections": [
    {
      "id": "764b85c1-1e23-4e4b-b0f1-e3d8f36c5b91",
      "title": "What is MFA?",
      "blocks": [
        {
          "id": "d93b1d72-8f1a-4c28-9d4e-1a2b3c4d5e6f",
          "kind": "text",
          "content": "# Multi-Factor Authentication\\n\\nMFA adds a **second layer of security** to your accounts.\\n\\n### The Three Factors:\\n1. **Something you know** (Password)\\n2. **Something you have** (Phone app, security key)\\n3. **Something you are** (Fingerprint, face scan)"
        },
        {
          "id": "e82c2a83-9a2b-4d3c-9e5f-1a2b3c4d5e6f",
          "kind": "question",
          "question": {
            "id": "f93d3b94-0b3c-4e4d-9f6a-1a2b3c4d5e6f",
            "type": "multiple_choice",
            "text": "Which of these is an example of 'Something you have'?",
            "choices": [
              { "id": "a1b2c3d4", "text": "Your mother's maiden name", "isCorrect": false },
              { "id": "b2c3d4e5", "text": "A hardware security key (YubiKey)", "isCorrect": true },
              { "id": "c3d4e5f6", "text": "Your 8-character password", "isCorrect": false }
            ],
            "answer": ""
          }
        }
      ]
    }
  ]
}
\`\`\`
`

interface StorageModalProps {
    readonly isOpen: boolean
    readonly onClose: () => void
    readonly onImport: (data: ModuleFormData) => void
    readonly data: ModuleFormData
}

type Tab = 'import' | 'export'

export function StorageModal({ isOpen, onClose, onImport, data }: StorageModalProps) {
    const [tab, setTab] = useState<Tab>('import')
    const [importText, setImportText] = useState('')
    const [importError, setImportError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleImportText = () => {
        try {
            const parsed = JSON.parse(importText)
            onImport(parsed)
            onClose()
            toast.success('Module imported successfully')
        } catch {
            setImportError('Invalid JSON format.')
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string)
                onImport(parsed)
                onClose()
                toast.success('Module imported from file')
            } catch {
                setImportError('The file content is not valid JSON.')
            }
        }
        reader.readAsText(file)
    }

    const handleCopyExport = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2))
        toast.success('JSON copied to clipboard')
    }

    const handleDownloadExport = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `module-${data.title.toLowerCase().replace(/\s+/g, '-') || 'export'}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('JSON file downloaded')
    }

    const handleCopyPromptGuide = () => {
        navigator.clipboard.writeText(PROMPT_GUIDE_CONTENT)
        toast.success('Prompt Guide copied to clipboard')
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border h-[600px] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
                    <div className="flex items-center gap-2 bg-surface-subtle border border-border rounded-xl p-1">
                        <button
                            type="button"
                            onClick={() => setTab('import')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'import'
                                ? 'bg-surface text-primary shadow-sm shadow-primary/10'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Import
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('export')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'export'
                                ? 'bg-surface text-primary shadow-sm shadow-primary/10'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Export
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyPromptGuide}
                            title="Copy Prompt Guide (LLM Generation)"
                            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface text-foreground hover:bg-[#7C3AED]/10 hover:border-[#7C3AED]/40 hover:text-[#A78BFA] transition-colors"
                        >
                            <Bot className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={onClose} className="p-1 hover:bg-surface-subtle rounded-lg text-muted-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {tab === 'import' ? (
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all active:scale-[0.99]"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <FileJson className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-foreground">Upload JSON file</p>
                                    <p className="text-xs text-muted-foreground mt-1">Select a previously exported module file</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-muted-foreground/30 text-[10px] font-bold uppercase tracking-widest px-1">
                                <div className="h-px bg-border flex-1" />
                                <span>or paste content</span>
                                <div className="h-px bg-border flex-1" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <textarea
                                    value={importText}
                                    onChange={(e) => { setImportText(e.target.value); setImportError(null); }}
                                    placeholder="Paste module JSON here..."
                                    wrap="off"
                                    className="w-full h-40 bg-surface-subtle border border-border rounded-xl px-4 py-4 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground overflow-auto whitespace-pre"
                                />
                                {importError && <p className="text-xs text-red-500 font-medium px-1">{importError}</p>}
                            </div>

                            <button
                                type="button"
                                onClick={handleImportText}
                                disabled={!importText.trim()}
                                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:translate-y-0.5 disabled:opacity-40"
                            >
                                Import from Clipboard
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="px-6 pt-6 pb-2 shrink-0">
                                <div className="flex items-center justify-between px-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Module JSON Snapshot</p>
                                    <span className="text-[10px] font-medium text-muted-foreground/40">{JSON.stringify(data).length} chars</span>
                                </div>
                            </div>

                            <div className="flex-1 px-6 overflow-hidden">
                                <pre className="w-full h-full bg-surface-subtle border border-border rounded-xl px-4 py-4 text-[13px] font-mono text-foreground overflow-auto">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            </div>

                            <div className="p-6 shrink-0 bg-surface border-t border-border">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCopyExport}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-surface border border-border text-foreground font-bold text-sm hover:bg-surface-subtle transition-all active:translate-y-0.5"
                                    >
                                        Copy to clipboard
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownloadExport}
                                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:translate-y-0.5"
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
