import { useState, useCallback } from 'react'
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, X } from 'lucide-react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useKeycloak } from '@react-keycloak/web'
import { toast } from 'sonner'
import { createCourse, type CourseDifficulty } from '@/services/coursesApi'
import { type Module } from '@/services/modulesApi'
import { CourseCreatorTopBar } from './CourseCreatorTopBar'
import { AvailableModuleList } from './AvailableModuleList'
import { CourseModuleStack } from './CourseModuleStack'
import { ContentFilePicker, type ContentFileItem } from '@/components/content-manager/modules/module-creation/ContentFilePicker'



const DIFFICULTY_OPTIONS: CourseDifficulty[] = ['Easy', 'Medium', 'Hard']
const DIFFICULTY_ACTIVE: Record<CourseDifficulty, string> = {
    Easy:   'bg-green-500/15 text-green-400 border-green-500/40',
    Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
    Hard:   'bg-red-500/15 text-red-400 border-red-500/40',
}
const DIFFICULTY_IDLE = 'bg-surface-subtle text-muted-foreground border-border hover:border-[#7C3AED]/40'

interface CourseCreatorProps {
    readonly onBack: () => void
    readonly onPublished?: () => void
}

export function CourseCreator({ onBack, onPublished }: CourseCreatorProps) {
    const { keycloak } = useKeycloak()

    // Core state
    const [courseTitle,      setCourseTitle]      = useState('')
    const [description,      setDescription]      = useState('')
    const [category,         setCategory]         = useState('')
    const [difficulty,       setDifficulty]       = useState<CourseDifficulty>('Easy')
    const [expectedTime,     setExpectedTime]     = useState('')
    const [coverImageId,     setCoverImageId]     = useState<string | null>(null)
    const [coverImageUrl,    setCoverImageUrl]    = useState<string | null>(null)
    const [selectedModules,  setSelectedModules]  = useState<Module[]>([])
    const [isSaving,         setIsSaving]         = useState(false)
    const [showFilePicker,   setShowFilePicker]   = useState(false)
    const [activeModule,     setActiveModule]     = useState<Module | null>(null)

    const selectedIds = selectedModules.map((m) => m.id)

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const mod = event.active.data.current?.module as Module | undefined
        if (mod) setActiveModule(mod)
    }, [])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveModule(null)
        const { active, over } = event
        if (!over) return

        const activeId = String(active.id)
        const overId   = String(over.id)

        // Drop from library into stack
        if (activeId.startsWith('library-')) {
            const mod = active.data.current?.module as Module | undefined
            if (mod && (overId === 'course-stack' || overId.startsWith('stack-'))) {
                setSelectedModules((prev) => prev.some(m => m.id === mod.id) ? prev : [...prev, mod])
            }
            return
        }

        // Reorder inside stack
        if (activeId.startsWith('stack-') && overId.startsWith('stack-')) {
            const oldIdx = Number.parseInt(activeId.replace('stack-', ''), 10)
            const newIdx = Number.parseInt(overId.replace('stack-', ''), 10)
            if (oldIdx !== newIdx) {
                setSelectedModules((prev) => arrayMove(prev, oldIdx, newIdx))
            }
        }
    }, [])

    const handleRemove = useCallback((index: number) => {
        setSelectedModules((prev) => prev.filter((_, i) => i !== index))
    }, [])

    // Handle cover image selection from ContentFilePicker
    const handleCoverImageSelected = (url: string, item: ContentFileItem) => {
        setCoverImageId(item.content_piece_id)
        setCoverImageUrl(url)
    }

    const handlePublish = async () => {
        if (!courseTitle.trim()) { toast.error('Title is required.'); return }
        if (!description.trim()) { toast.error('Description is required.'); return }
        if (!category.trim())    { toast.error('Category is required.'); return }
        if (!expectedTime.trim()) { toast.error('Expected time is required.'); return }
        if (selectedModules.length === 0) { toast.error('Add at least one module.'); return }

        setIsSaving(true)
        try {
            await createCourse({
                title:         courseTitle.trim(),
                description:   description.trim(),
                category:      category.trim(),
                difficulty,
                expected_time: expectedTime.trim(),
                cover_image:   coverImageId,
                modules:       selectedModules.map((m) => m.id),
            }, keycloak.token)
            toast.success('Course published!')
            onPublished?.()
            onBack()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to publish course.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 w-full h-full flex flex-col bg-background">
            <CourseCreatorTopBar
                title={courseTitle}
                onTitleChange={setCourseTitle}
                onBack={onBack}
                onPreview={() => undefined}
                canPreview={selectedModules.length > 0}
                onPublish={() => { void handlePublish() }}
                isSaving={isSaving}
            />

            <DndContext collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex-1 flex overflow-hidden">
                    {/* Centre – course stack */}
                    <div className="flex-1 overflow-hidden">
                        <CourseModuleStack modules={selectedModules} onRemove={handleRemove} />
                    </div>

                    {/* Right – metadata sidebar + module library */}
                    <div className="w-80 flex-shrink-0 bg-surface border-l border-border overflow-y-auto flex flex-col">
                        {/* Metadata fields */}
                        <div className="px-4 pt-4 pb-3 border-b border-border space-y-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</p>

                            {/* Description */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="What will learners gain?"
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 resize-none"
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
                                <input
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="e.g. Security Fundamentals"
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                                />
                            </div>

                            {/* Difficulty */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Difficulty</label>
                                <div className="flex gap-2">
                                    {DIFFICULTY_OPTIONS.map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setDifficulty(d)}
                                            className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${difficulty === d ? DIFFICULTY_ACTIVE[d] : DIFFICULTY_IDLE}`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Expected time */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expected Time</label>
                                <input
                                    value={expectedTime}
                                    onChange={(e) => setExpectedTime(e.target.value)}
                                    placeholder="e.g. 2h 30m"
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                                />
                            </div>

                            {/* Cover image */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cover Image</label>
                                {coverImageUrl ? (
                                    <div className="relative group rounded-lg overflow-hidden border border-border">
                                        <img src={coverImageUrl} alt="Cover" className="w-full h-28 object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setCoverImageId(null); setCoverImageUrl(null) }}
                                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowFilePicker(true)}
                                        className="w-full h-20 rounded-lg border-2 border-dashed border-border hover:border-[#7C3AED]/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-[#A78BFA] transition-colors"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                        <span className="text-xs font-medium">Choose image</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Module library */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <AvailableModuleList selectedIds={selectedIds} />
                        </div>
                    </div>
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeModule && (
                        <div className="w-64 opacity-90 rotate-2 scale-105 p-3 rounded-xl border border-[#7C3AED]/40 bg-surface shadow-xl">
                            <p className="text-sm font-semibold text-foreground truncate">{activeModule.title}</p>
                            <p className="text-xs text-muted-foreground">{activeModule.category}</p>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            <AnimatePresence>
                {showFilePicker && (
                    <ContentFilePicker
                        token={keycloak.token ?? ''}
                        accept="image"
                        onSelect={(url, item) => {
                            setShowFilePicker(false)
                            handleCoverImageSelected(url, item)
                        }}
                        onClose={() => setShowFilePicker(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
