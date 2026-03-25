import { motion } from 'framer-motion'
import { X, Layers, Info } from 'lucide-react'
import CourseHeader from '@/components/courses/CourseHeader'
import ModuleCard from '@/components/courses/ModuleCard'
import { type Module } from '@/services/modulesApi'
import { type CourseDifficulty } from '@/services/coursesApi'

interface CoursePreviewProps {
    readonly data: {
        title: string
        description: string
        category: string
        difficulty: CourseDifficulty
        coverImageUrl: string | null
        expectedTime: string
    }
    readonly selectedModules: Module[]
    readonly onClose: () => void
}

export function CoursePreview({ data, selectedModules, onClose }: CoursePreviewProps) {
    // Adapt data to CourseHeader's expected Course type
    const adaptedCourse = {
        id: 'preview',
        title: data.title || 'Untitled Course',
        description: data.description || 'No description provided.',
        difficulty: data.difficulty === 'Easy' ? 'Beginner' : data.difficulty === 'Medium' ? 'Intermediate' : 'Advanced',
        duration: data.expectedTime,
        userCount: 0,
        category: data.category || 'Uncategorized',
        color: 'from-purple-600 to-purple-800',
        icon: '🛡️',
        coverImage: data.coverImageUrl,
        modules: selectedModules.map(m => ({ id: m.id })) // Used for count
    }

    // Adapt modules to ModuleCard's expected CourseModule type
    const adaptedModules = selectedModules.map((m) => ({
        id: m.id,
        title: m.title || 'Untitled Module',
        description: m.description || '',
        lessons: m.sections?.length || 0,
        labs: 0,
        hours: m.estimated_time ? `${m.estimated_time}m` : '0m',
        difficulty: m.difficulty as 'Easy' | 'Medium' | 'Hard',
        completion: 0,
        status: 'not-started' as const,
    }))

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md flex flex-col overflow-hidden"
        >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Info className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-foreground">Course Preview</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Draft Version</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-surface-subtle text-muted-foreground hover:text-foreground transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-surface-subtle/30">
                <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                    {/* Course Header */}
                    <CourseHeader course={adaptedCourse as any} overallProgress={0} />

                    {/* Modules Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Layers className="w-5 h-5 text-primary/60" />
                                Syllabus
                            </h3>
                            <span className="text-xs text-muted-foreground font-medium bg-surface px-2 py-1 rounded-md border border-border">
                                {selectedModules.length} {selectedModules.length === 1 ? 'Module' : 'Modules'}
                            </span>
                        </div>

                        <div className="grid gap-4">
                            {adaptedModules.length > 0 ? (
                                adaptedModules.map((mod) => (
                                    <ModuleCard key={mod.id} module={mod} />
                                ))
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-surface/50">
                                    <Layers className="w-10 h-10 opacity-20" />
                                    <p className="text-sm font-medium">No modules added to this course yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
