import { useCallback, useEffect, useRef, useState } from 'react'
import {
    createModule,
    patchModule,
    type CreateModulePayload,
    type Module,
    type ModuleBlock,
    type ModuleQuestionBlock,
    type ModuleRichContentBlock,
    type ModuleSection,
} from '@/services/modulesApi'
import type { Block, ModuleFormData } from './types'

/* ─────────────────────────────────────────────────────────
   Save status type
───────────────────────────────────────────────────────── */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/* ─────────────────────────────────────────────────────────
   Map frontend camelCase → backend snake_case
───────────────────────────────────────────────────────── */
function mapBlock(block: Block, order: number): ModuleBlock {
    if (block.kind === 'text') {
        return { id: block.id, kind: 'text', order, content: block.content }
    }
    if (block.kind === 'rich_content') {
        return {
            id:         block.id,
            kind:       'rich_content',
            order,
            media_type: block.mediaType,
            url:        block.url,
            caption:    block.caption,
        } satisfies ModuleRichContentBlock
    }
    // question
    return {
        id:   block.id,
        kind: 'question',
        order,
        question: {
            id:      block.question.id,
            type:    block.question.type,
            text:    block.question.text,
            answer:  block.question.answer,
            choices: block.question.choices.map(c => ({
                id:         c.id,
                text:       c.text,
                is_correct: c.isCorrect,
            })),
        },
    } satisfies ModuleQuestionBlock
}

function mapSection(section: ModuleFormData['sections'][number], order: number): ModuleSection {
    return {
        id:                      section.id,
        title:                   section.title,
        order,
        collapsed:               false,          // strip UI-only state — always persist as false
        require_correct_answers: section.requireCorrectAnswers ?? false,
        is_optional:             section.isOptional ?? false,
        min_time_spent:          section.minTimeSpent ?? 0,
        blocks:                  section.blocks.map((b, bi) => mapBlock(b, bi)),
    }
}

export function buildPayload(data: ModuleFormData): CreateModulePayload {
    return {
        title:          data.title,
        category:       data.category,
        description:    data.description,
        cover_image:    data.coverImage || undefined,
        estimated_time: data.estimatedTime,
        difficulty:     data.difficulty,
        sections:       data.sections.map((s, si) => mapSection(s, si)),
    }
}

/* ─────────────────────────────────────────────────────────
   useAutoSave hook
   - First save:  POST /modules (creates draft, stores id)
   - Subsequent:  PATCH /modules/{id} debounced by `delay` ms
   - On unmount:  flushes any pending save immediately
───────────────────────────────────────────────────────── */
export function useAutoSave(
    data: ModuleFormData,
    token?: string,
    delay = 1500,
) {
    const [saveStatus, setSaveStatus]   = useState<SaveStatus>('idle')
    const [moduleId,   setModuleId]     = useState<string | null>(null)
    const [savedModule, setSavedModule] = useState<Module | null>(null)

    const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingRef      = useRef<CreateModulePayload | null>(null)
    const isSavingRef     = useRef(false)
    const moduleIdRef     = useRef<string | null>(null)
    const isFirstSaveRef  = useRef(true)

    // Keep moduleIdRef in sync so the flush callback can read it without stale closure
    useEffect(() => { moduleIdRef.current = moduleId }, [moduleId])

    const doSave = useCallback(async (payload: CreateModulePayload) => {
        if (isSavingRef.current) {
            // Another save in-flight — re-queue for after it finishes
            pendingRef.current = payload
            return
        }

        isSavingRef.current = true
        setSaveStatus('saving')

        try {
            let result: Module

            if (isFirstSaveRef.current || moduleIdRef.current === null) {
                // First ever save → POST (create the draft)
                result = await createModule(payload, token)
                isFirstSaveRef.current = false
                setModuleId(result.id)
                moduleIdRef.current = result.id
            } else {
                // Subsequent saves → PATCH
                result = await patchModule(moduleIdRef.current, payload, token)
            }

            setSavedModule(result)
            setSaveStatus('saved')
        } catch {
            setSaveStatus('error')
        } finally {
            isSavingRef.current = false

            // If another save was queued while we were in-flight, run it now
            if (pendingRef.current) {
                const queued = pendingRef.current
                pendingRef.current = null
                void doSave(queued)
            }
        }
    }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

    // Debounce: reset timer on every data change
    useEffect(() => {
        // Don't save if title is empty (not yet a meaningful draft)
        if (!data.title.trim()) return

        const payload = buildPayload(data)

        // Clear previous timer
        if (timerRef.current !== null) clearTimeout(timerRef.current)

        setSaveStatus('saving') // optimistic — shows "Saving..." immediately

        timerRef.current = setTimeout(() => {
            timerRef.current = null
            void doSave(payload)
        }, delay)
    }, [data, delay, doSave])

    // Flush on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current)
                timerRef.current = null
                if (data.title.trim()) {
                    void doSave(buildPayload(data))
                }
            }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return { saveStatus, moduleId, savedModule }
}
