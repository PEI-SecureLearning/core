import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { fetchCourse, type Course } from "@/services/coursesApi";
import { fetchModule, type Module } from "@/services/modulesApi";
import { getCourseProgress, type UserProgress } from "@/services/progressApi";
import CourseHeader from "@/components/courses/CourseHeader";
import ModuleCard from "@/components/courses/ModuleCard";
import type { CourseModule } from "@/components/courses/courseData";

export const Route = createFileRoute("/courses/$courseId/")({
  component: CourseDetail
});

function CourseDetail() {
  const { courseId } = Route.useParams();
  const { keycloak } = useKeycloak();
  const userId = keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.email || keycloak.tokenParsed?.sub;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!keycloak.token || !userId) return;

    async function loadData() {
      try {
        const courseData = await fetchCourse(courseId, keycloak.token!);
        if (cancelled) return;
        setCourse(courseData);

        let progData: UserProgress | null = null;
        try {
          progData = await getCourseProgress(userId!, courseId, keycloak.token!);
          if (!cancelled) setProgress(progData);
        } catch {
          // Ignore progress fetch errors (e.g., 404 not enrolled)
        }

        if (courseData.modules?.length > 0) {
          const mods = await Promise.all(
            courseData.modules.map(mId => fetchModule(mId, keycloak.token!).catch(() => null))
          );
          if (!cancelled) setModules(mods.filter(Boolean) as Module[]);
        } else {
          if (!cancelled) setModules([]);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load course details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    void loadData();

    return () => { cancelled = true; };
  }, [courseId, keycloak.token, userId]);

  const [headerVisible, setHeaderVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const current = el.scrollTop;
    const delta = current - lastScrollY.current;
    if (Math.abs(delta) > 4) {
      setHeaderVisible(delta < 0 || current < 10);
      lastScrollY.current = current;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary/70" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <BookOpen size={48} className="mb-4 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold text-foreground">
          {error || "Course not found"}
        </h2>
        <p className="text-sm mt-1">
          The course you're looking for doesn't exist or you don't have access.
        </p>
        <Link
          to="/courses"
          className="mt-4 text-sm text-primary hover:text-primary font-medium"
        >
          ← Back to courses
        </Link>
      </div>
    );
  }

  // adapt backend data to UI shape
  let totalModulesProgress = 0;

  const adaptedModules: CourseModule[] = modules.map((mod) => {
    const moduleSections = mod.sections || [];
    const totalCount = moduleSections.length;
    let completedCount = 0;
    let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';

    if (progress) {
      completedCount = moduleSections.filter(s => progress.completed_sections?.includes(s.id)).length;
      if (totalCount > 0 && completedCount === totalCount) {
        status = 'completed';
      } else if (completedCount > 0 || Object.keys(progress.progress_data || {}).some(k => moduleSections.some(s => s.id === k))) {
        status = 'in-progress';
      }
    }

    const completionPercent = totalCount === 0 ? (status === 'completed' ? 100 : 0) : Math.round((completedCount / totalCount) * 100);
    totalModulesProgress += completionPercent;

    return {
      id: mod.id,
      title: mod.title,
      description: mod.description,
      difficulty: mod.difficulty,
      status,
      completion: completionPercent,
      lessons: totalCount,
      labs: 0,
      hours: mod.estimated_time || "0h",
    };
  });

  const overallProgress = modules.length > 0 ? Math.round(totalModulesProgress / modules.length) : 0;

  // sort adapted modules: completed go to bottom
  const sortedModules = [...adaptedModules].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;
    return 0; // maintain original order otherwise
  });

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-auto"
    >
      {/* Sticky header: breadcrumb + course hero */}
      <div
        className={`sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/40 px-6 pt-4 pb-4 space-y-3 transition-all duration-300 ease-in-out ${headerVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-full pointer-events-none"
          }`}
      >
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/courses" className="hover:text-primary transition-colors">
            Courses
          </Link>
          <ChevronRight size={14} className="text-muted-foreground/70" />
          <span className="text-foreground font-medium">{course.title}</span>
        </nav>

        {/* We adapt the course object for CourseHeader which expects COURSES[x] structure */}
        <CourseHeader course={{
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          difficulty: course.difficulty,
          expected_time: course.expected_time,
          modules: [] // Not used by CourseHeader internally except for count maybe? Wait, CourseHeader expects `course.modules` to be array of `CourseModule`
        } as any} overallProgress={overallProgress} />
      </div>

      {/* Module list */}
      <div className="px-6 py-4 space-y-4">
        {sortedModules.map((mod) => (
          <div key={mod.id} className={mod.status === 'completed' ? 'opacity-60 grayscale-[30%]' : ''}>
            <ModuleCard module={mod} courseId={courseId} />
          </div>
        ))}
        {sortedModules.length === 0 && (
          <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
            No modules are currently available for this course.
          </div>
        )}
      </div>
    </div>
  );
}
