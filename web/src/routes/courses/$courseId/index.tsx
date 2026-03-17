import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { COURSES } from "@/components/courses/courseData";
import CourseHeader from "@/components/courses/CourseHeader";
import ModuleCard from "@/components/courses/ModuleCard";

export const Route = createFileRoute("/courses/$courseId/")({
  component: CourseDetail
});

function CourseDetail() {
  const { courseId } = Route.useParams();
  const course = COURSES.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <BookOpen size={48} className="mb-4 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold text-foreground">
          Course not found
        </h2>
        <p className="text-sm mt-1">
          The course you're looking for doesn't exist.
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

  const overallProgress = course.modules.length
    ? Math.round(
        course.modules.reduce((sum, m) => sum + m.completion, 0) /
          course.modules.length
      )
    : 0;

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

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-auto"
    >
      {/* Sticky header: breadcrumb + course hero */}
      <div
        className={`sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/40 px-6 pt-4 pb-4 space-y-3 transition-all duration-300 ease-in-out ${
          headerVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/courses" className="hover:text-primary transition-colors">
            Courses
          </Link>
          <ChevronRight size={14} className="text-muted-foreground/70" />
          <span className="text-foreground font-medium">{course.title}</span>
        </nav>

        {/* Hero header */}
        <CourseHeader course={course} overallProgress={overallProgress} />
      </div>

      {/* Module list */}
      <div className="px-6 py-4 space-y-4">
        {course.modules.map((mod) => (
          <ModuleCard key={mod.id} module={mod} courseId={courseId} />
        ))}
      </div>
    </div>
  );
}
