import { createFileRoute, Link } from '@tanstack/react-router'
import { BookOpen, ChevronRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import { fetchCourse, type Course } from '@/services/coursesApi'
import { fetchModule, type Module } from '@/services/modulesApi'
import { getCourseProgress, completeSection, updateProgress, type UserProgress } from '@/services/progressApi'
import ModuleLearner from '@/components/courses/ModuleLearner'
import { toast } from 'sonner'

export const Route = createFileRoute('/courses/$courseId/modules/$moduleId')({
    component: ModuleLearnerRoute,
})

function ModuleLearnerRoute() {
    const { courseId, moduleId } = Route.useParams()
    const { keycloak } = useKeycloak()
    const userId = keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.email || keycloak.tokenParsed?.sub

    const [course, setCourse] = useState<Course | null>(null)
    const [mod, setMod] = useState<Module | null>(null)
    const [progress, setProgress] = useState<UserProgress | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false;
        if (!keycloak.token || !userId) return;

        async function loadData() {
            try {
                const [courseData, modData] = await Promise.all([
                    fetchCourse(courseId, keycloak.token!),
                    fetchModule(moduleId, keycloak.token!)
                ]);
                if (cancelled) return;
                setCourse(courseData);
                setMod(modData);

                try {
                    const progData = await getCourseProgress(userId!, courseId, keycloak.token!);
                    if (!cancelled) setProgress(progData);
                } catch {
                    // Ignore progress error
                }
            } catch (err) {
                if (!cancelled) setError("Failed to load module details.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        
        setLoading(true);
        void loadData();

        return () => { cancelled = true; };
    }, [courseId, moduleId, keycloak.token, userId]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary/70" />
            </div>
        );
    }

    if (error || !course || !mod) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <BookOpen size={48} className="mb-4 text-muted-foreground/50" />
                <h2 className="text-xl font-semibold text-foreground">{error || "Module not found"}</h2>
                <p className="text-sm mt-1">The module you're looking for doesn't exist.</p>
                <Link to="/courses" className="mt-4 text-sm text-primary hover:text-primary font-medium">
                    ← Back to courses
                </Link>
            </div>
        )
    }

    const handleSectionComplete = async (sectionId: string, totalSections: number) => {
        if (!userId || !keycloak.token) return;
        try {
            await completeSection(userId, courseId, sectionId, totalSections, keycloak.token);
            // We do a quiet background update, ModuleLearner maintains optimistic state already
        } catch (err) {
            toast.error("Failed to save progress", {
                description: "Your progress might not have been fully recorded."
            });
        }
    };

    const handleTaskComplete = async (sectionId: string, taskId: string) => {
        if (!userId || !keycloak.token) return;
        try {
            await updateProgress(userId, courseId, sectionId, taskId, keycloak.token);
        } catch (err) {
            console.error("Failed to save task progress", err);
        }
    };

    // Adapt the UI backend model to ModuleLearner's expected structure if needed
    // ModuleLearner uses mod.sections and mod.title, which match the new backend `Module` type!
    // The only difference might be difficulty mapping or estimatedTime.
    const adaptedMod: any = {
        ...mod,
        estimatedTime: mod.estimated_time,
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground px-6 pt-4 pb-2 flex-shrink-0 bg-background border-b border-border/40">
                <Link to="/courses" className="hover:text-primary transition-colors">
                    Courses
                </Link>
                <ChevronRight size={14} className="text-muted-foreground/70" />
                <Link
                    to={'/courses/$courseId' as any}
                    params={{ courseId } as any}
                    className="hover:text-primary transition-colors truncate max-w-[200px]"
                >
                    {course.title}
                </Link>
                <ChevronRight size={14} className="text-muted-foreground/70" />
                <span className="text-foreground font-medium truncate max-w-xs">{mod.title}</span>
            </nav>

            {/* Module learner */}
            <div className="flex-1 overflow-hidden relative">
                <ModuleLearner 
                    module={adaptedMod} 
                    courseId={courseId} 
                    initialCompletedSections={progress?.completed_sections || []}
                    onSectionComplete={handleSectionComplete}
                    onTaskComplete={handleTaskComplete}
                />
            </div>
        </div>
    )
}
