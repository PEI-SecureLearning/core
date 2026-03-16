import { useState, useRef, useCallback } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { useKeycloak } from "@react-keycloak/web";
import { COURSES } from "./courseData";
import type { Course } from "./courseData";
import CourseCard, { type CardItem } from "./CourseCard";
import CourseFilters from "./UniversalFilters";
import type { GridCols } from "./UniversalFilters";

const ELEVATED_ROLES = [
  "admin",
  "org_manager",
  "CUSTOM_ORG_ADMIN",
  "CONTENT_MANAGER"
];

function courseToCardItem(course: Course, showProgress: boolean): CardItem {
  const progress = course.modules.length
    ? Math.round(
        course.modules.reduce((sum, m) => sum + m.completion, 0) /
          course.modules.length
      )
    : 0;
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    icon: course.icon,
    color: course.color,
    category: course.category,
    duration: course.duration,
    unitCount: course.modules.length,
    unitLabel: "modules",
    userCount: course.userCount,
    progress,
    showProgress
  };
}

export type { Course };

const CATEGORY_OPTIONS = [
  "All",
  ...Array.from(new Set(COURSES.map((c) => c.category)))
];

const gridClass: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
};

type CourseListProps = {
  showNewCourse?: boolean;
  basePath?: string;
};

export default function CourseList({
  showNewCourse = false,
  basePath = "/courses"
}: CourseListProps = {}) {
  const { keycloak } = useKeycloak();
  const userRoles = keycloak.tokenParsed?.realm_access?.roles ?? [];
  const isLearner = !ELEVATED_ROLES.some((r) => userRoles.includes(r));

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [category, setCategory] = useState("All");
  const [cols, setCols] = useState<GridCols>(2);
  const [headerVisible, setHeaderVisible] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const current = el.scrollTop;
    const delta = current - lastScrollY.current;

    // Only react to intentional scrolls (> 4px) to avoid jitter
    if (Math.abs(delta) > 4) {
      setHeaderVisible(delta < 0 || current < 10);
      lastScrollY.current = current;
    }
  }, []);

  const filtered = COURSES.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty =
      difficulty === "All" || course.difficulty === difficulty;
    const matchesCategory = category === "All" || course.category === category;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative h-full overflow-y-auto"
    >
      {/* ── Sticky header + filters ───────────────────────────────── */}
      <div
        className={`sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/40 px-6 pt-6 pb-4 space-y-4 transition-all duration-500 ease-in-out ${
          headerVisible
            ? "opacity-100 translate-y-0 shadow-none"
            : "opacity-0 -translate-y-full pointer-events-none shadow-md"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Courses</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse and complete security training courses assigned to your
              organization.
            </p>
          </div>
          {showNewCourse && (
            <Link
              to={"/content-manager/courses/new" as any}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 active:scale-[0.97]"
            >
              <Plus size={16} strokeWidth={2.5} />
              New Course
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <CourseFilters
          search={search}
          onSearchChange={setSearch}
          primaryFilterValue={difficulty}
          primaryFilterOptions={["All", "Easy", "Medium", "Hard"]}
          onPrimaryFilterChange={setDifficulty}
          primaryLabel="All Difficulties"
          secondaryFilterValue={category}
          secondaryFilterOptions={CATEGORY_OPTIONS}
          onSecondaryFilterChange={setCategory}
          secondaryLabel="All Categories"
          cols={cols}
          onColsChange={setCols}
          resultCount={filtered.length}
          entityName="course"
        />
      </div>

      {/* ── Content Area ───────────────────────────────────────────── */}
      <div className="px-6 pt-4 pb-6">
        {filtered.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/70">
            <div className="w-16 h-16 rounded-full bg-surface-subtle flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground/40" />
            </div>
            {search.trim() ? (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  No courses match "{search}"
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Try a different search term or reset filters.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  No courses yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Create your first course to get started.
                </p>
              </>
            )}
          </div>
        ) : (
          /* Grid Display */
          <LayoutGroup>
            <motion.div layout className={`grid ${gridClass[cols]} gap-6`}>
              <AnimatePresence mode="popLayout">
                {filtered.map((course) => (
                  <motion.div
                    key={course.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{
                      y: -4,
                      scale: 1.02,
                      boxShadow:
                        "0 12px 28px -6px rgba(147, 51, 234, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.06)"
                    }}
                    transition={{
                      layout: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 },
                      y: { type: "spring", stiffness: 400, damping: 25 },
                      boxShadow: { duration: 0.25 }
                    }}
                    className="rounded-xl cursor-pointer"
                  >
                    <CourseCard
                      item={courseToCardItem(course, isLearner)}
                      cols={cols}
                      basePath={basePath}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </div>
    </div>
  );
}
