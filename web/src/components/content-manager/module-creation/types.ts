/* ─────────────────────────────────────────────────────────
   Module Creation — shared types
───────────────────────────────────────────────────────── */

export type QuestionType  = 'multiple_choice' | 'true_false' | 'short_answer'
export type BlockType     = 'text' | 'question' | 'rich_content'
export type RichMediaType = 'image' | 'video' | 'audio' | 'file'
export type Difficulty    = 'Easy' | 'Medium' | 'Hard'
export type ModuleStatus  = 'draft' | 'published' | 'archived'

export interface Choice {
    id:        string
    text:      string
    isCorrect: boolean
}

export interface Question {
    id:      string
    type:    QuestionType
    text:    string
    choices: Choice[]
    answer:  string
}

// A block is one piece of content inside a section
export interface TextBlock {
    id:      string
    kind:    'text'
    content: string
}
export interface RichContentBlock {
    id:        string
    kind:      'rich_content'
    mediaType: RichMediaType
    url:       string
    caption:   string
}
export interface QuestionBlock {
    id:       string
    kind:     'question'
    question: Question
}
export type Block = TextBlock | RichContentBlock | QuestionBlock

export interface Section {
    id:                     string
    title:                  string
    collapsed:              boolean   // UI-only, not persisted to DB
    blocks:                 Block[]
    requireCorrectAnswers?: boolean
    isOptional?:            boolean
    minTimeSpent?:          number
}

export interface ModuleFormData {
    title:         string
    category:      string
    description:   string
    coverImage:    string
    estimatedTime: string
    difficulty:    Difficulty
    sections:      Section[]
}

// ── What the backend returns after create/update ──────────
export interface SavedModule extends ModuleFormData {
    id:          string           // MongoDB ObjectId as string
    status:      ModuleStatus
    version:     number           // for optimistic concurrency
    realm?:      string
    createdBy?:  string
    createdAt:   string
    updatedAt:   string
}
