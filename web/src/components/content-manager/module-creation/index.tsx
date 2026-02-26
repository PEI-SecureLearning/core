import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Check, ArrowLeft } from 'lucide-react'
import { createModule, type CreateModulePayload } from '@/services/modulesApi'
import type { Block, Choice, ModuleFormData, QuestionBlock } from './types'
import { ProgressBar } from './ProgressBar'
import { DetailsSidebar } from './DetailsSidebar'
import { SectionsEditor } from './SectionsEditor'
import { ModulePreview } from './ModulePreview'

/* ── Initial form state ── */
const INITIAL_DATA: ModuleFormData = {
    title: '',
    category: '',
    description: '',
    coverImage: '',
    estimatedTime: '',
    difficulty: 'Beginner',
    sections: [],
}

interface ModuleCreationFormProps {
    token?: string
    onSuccess?: (moduleId: number) => void
    onBack?: () => void
}

export function ModuleCreationForm({ token, onSuccess, onBack }: Readonly<ModuleCreationFormProps>) {
    const [data, setData] = useState<ModuleFormData>(INITIAL_DATA)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [previewOpen, setPreviewOpen] = useState(false)

    const patch = useCallback((p: Partial<ModuleFormData>) => {
        setData(d => ({ ...d, ...p }))
    }, [])

    const buildPayload = useCallback((): CreateModulePayload => {
        const mapChoice = (c: Choice) => ({ id: c.id, text: c.text, is_correct: c.isCorrect })
        const mapQuestion = (b: QuestionBlock) => ({
            id: b.question.id,
            type: b.question.type,
            text: b.question.text,
            choices: b.question.choices.map(mapChoice),
            answer: b.question.answer,
        })
        const isQuestionBlock = (b: Block): b is QuestionBlock => b.kind === 'question'

        return {
            title: data.title,
            category: data.category,
            description: data.description,
            cover_image: data.coverImage || undefined,
            estimated_time: data.estimatedTime,
            difficulty: data.difficulty,
            body: JSON.stringify(data.sections),
            questions: data.sections.flatMap(s =>
                s.blocks.filter(isQuestionBlock).map(mapQuestion)
            ),
        }
    }, [data])

    const handleSubmit = useCallback(async () => {
        if (!data.title.trim()) return
        
        setStatus('loading')
        try {
            const created = await createModule(buildPayload(), token)
            setStatus('success')
            onSuccess?.(created.id)
        } catch {
            setStatus('error')
        }
    }, [data.title, buildPayload, token, onSuccess])

    const togglePreview = useCallback(() => setPreviewOpen(prev => !prev), [])

    if (status === 'success') {
        return (
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center h-full gap-4 bg-white"
            >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Module Created!</h2>
                <p className="text-sm text-slate-500">"{data.title}" has been saved successfully.</p>
            </motion.div>
        )
    }

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
            {/* Header with back button */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 bg-white">
                {onBack && (
                    <>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-700 transition-colors"
                            aria-label="Back to Modules"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Modules
                        </button>
                        <div className="h-5 w-px bg-slate-300" aria-hidden="true" />
                    </>
                )}
                <h1 className="text-2xl font-bold text-slate-900">Create Module</h1>
            </div>

            {/* Progress bar */}
            <ProgressBar data={data} />

            {/* Main layout */}
            <div className="flex flex-row flex-1 overflow-hidden">
                {/* Left — collapsible details sidebar */}
                <DetailsSidebar 
                    data={data} 
                    onChange={patch}
                    onPreview={togglePreview}
                    onPublish={handleSubmit}
                    publishStatus={status}
                />

                {/* Right — sections editor */}
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <SectionsEditor data={data} onChange={patch} />
                </div>
            </div>

            {/* Module preview panel */}
            {previewOpen && (
                <ModulePreview data={data} onClose={togglePreview} />
            )}
        </div>
    )
}
