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
export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

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
            url:        block.contentId,   // send the platform content_piece_id
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
        title:              data.title,
        category:           data.category,
        description:        data.description,
        // Send null (not undefined) so clearing is persisted.
        cover_image:        data.coverImageId || null,
        estimated_time:     data.estimatedTime,
        difficulty:         data.difficulty,
        has_refresh_module: data.hasRefreshModule,
        sections:           data.sections.map((s, si) => mapSection(s, si)),
        refresh_sections:   (data.refreshSections ?? []).map((s, si) => mapSection(s, si)),
    }
}

/* ─────────────────────────────────────────────────────────
   useAutoSave hook
   - First save:  POST /modules (creates draft, stores id)
   - Subsequent:  PATCH /modules/{id} debounced by `delay` ms
   - On unmount:  flushes any pending save immediately
   - `getToken`:  called at save-time so a refreshed token is always used
───────────────────────────────────────────────────────── */
export function useAutoSave(
    data: ModuleFormData,
    getToken: () => string | undefined,
    delay = 15_000,          // save 15 s after the last change
    initialModuleId?: string, // pre-seed id when editing an existing module
) {
    const [saveStatus, setSaveStatus]   = useState<SaveStatus>('idle')
    const [moduleId,   setModuleId]     = useState<string | null>(initialModuleId ?? null)
    const [savedModule, setSavedModule] = useState<Module | null>(null)

    const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingRef      = useRef<CreateModulePayload | null>(null)
    const dataRef         = useRef<ModuleFormData>(data)
    const isSavingRef     = useRef(false)
    const moduleIdRef     = useRef<string | null>(initialModuleId ?? null)
    const isFirstSaveRef  = useRef(initialModuleId == null)
    const isDirtyRef      = useRef(false)   // stays false until the user actually changes data
    // Always holds the latest getter so doSave never closes over a stale token
    const getTokenRef     = useRef(getToken)
    useEffect(() => { getTokenRef.current = getToken }, [getToken])
    // Resolvers waiting for the current in-flight save to complete
    const saveWaitersRef  = useRef<Array<() => void>>([])

    // Keep dataRef in sync so forceSave always uses the latest form state
    useEffect(() => { dataRef.current = data }, [data])

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

        // Read the freshest token at the moment of the actual request
        const token = getTokenRef.current()

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

            // Notify anyone awaiting completion of this save
            const waiters = saveWaitersRef.current.splice(0)
            for (const resolve of waiters) resolve()

            // If another save was queued while we were in-flight, run it now
            if (pendingRef.current) {
                const queued = pendingRef.current
                pendingRef.current = null
                void doSave(queued)
            }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Debounce: reset timer on every data change
    useEffect(() => {
        // Skip the very first render — only save after the user has actually changed something
        if (!isDirtyRef.current) {
            isDirtyRef.current = true
            return
        }

        // Don't save if title is empty (not yet a meaningful draft)
        if (!data.title.trim()) return

        const payload = buildPayload(data)

        // Clear previous timer
        if (timerRef.current !== null) clearTimeout(timerRef.current)

        // Show "Unsaved changes" while waiting — NOT "Saving…" yet
        setSaveStatus('pending')

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
                // Only flush if the user actually changed something
                if (isDirtyRef.current && data.title.trim()) {
                    void doSave(buildPayload(data))
                }
            }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Cancel any pending debounce and save immediately.
     * Awaiting this promise guarantees the HTTP request has completed
     * (or failed) before resolving — safe to call before navigating away.
     */
    const forceSave = useCallback((): Promise<void> => {
        // Cancel the pending debounce timer
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        return new Promise<void>(resolve => {
            if (isSavingRef.current) {
                // A save is already in-flight — queue our payload as the next
                // save and register a waiter so we know when it finishes.
                pendingRef.current = buildPayload(dataRef.current)
                saveWaitersRef.current.push(resolve)
            } else {
                // No save in-flight — start one now and wait for it.
                saveWaitersRef.current.push(resolve)
                void doSave(buildPayload(dataRef.current))
            }
        })
    }, [doSave])

    /**
     * forceSave that only actually saves if data has been changed by the user.
     * Returns a resolved promise immediately if nothing is dirty.
     */
    const forceSaveIfDirty = useCallback((): Promise<void> => {
        if (!isDirtyRef.current) return Promise.resolve()
        return forceSave()
    }, [forceSave])

    return { saveStatus, moduleId, savedModule, forceSave, forceSaveIfDirty }
}
