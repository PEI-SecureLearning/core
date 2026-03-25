import { useState, useRef, useCallback, useEffect } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { useKeycloak } from "@react-keycloak/web";
import { toast } from "sonner";
import { fetchCourses, deleteCourse, type Course } from "@/services/coursesApi";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { useNavigate } from "@tanstack/react-router";
import CourseFilters from "./UniversalFilters";
import type { GridCols } from "./UniversalFilters";

const API_BASE = import.meta.env.VITE_API_URL as string;

const ELEVATED_ROLES = [
    "admin",
    "org_manager",
    "CUSTOM_ORG_ADMIN",
    "CONTENT_MANAGER"
];



const gridClass: Record<GridCols, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
};

type CourseListProps = {
    showNewCourse?: boolean;
    basePath?: string;
    hideControls?: boolean;
};

export default function CourseList({
    showNewCourse = false,
    basePath = "/courses",
    hideControls = false,
}: CourseListProps = {}) {
    const { keycloak } = useKeycloak();
    const navigate = useNavigate();
    const userRoles = keycloak.tokenParsed?.realm_access?.roles ?? [];
    const isContentManager = ELEVATED_ROLES.some((r) => userRoles.includes(r));
    const showControls = isContentManager && !hideControls;

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});

    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState("All");
    const [category, setCategory] = useState("All");
    const [cols, setCols] = useState<GridCols>(2);
    const [headerVisible, setHeaderVisible] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

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

    // Fetch courses from backend
    useEffect(() => {
        let cancelled = false;
        if (!keycloak.token) return;

        setLoading(true);
        setError(null);

        fetchCourses({
            token: keycloak.token,
            search: search || undefined,
            category: category !== "All" ? category : undefined,
            difficulty: difficulty !== "All" ? difficulty : undefined,
            limit: 100,
        })
            .then((data) => {
                if (!cancelled) setCourses(data.items);
            })
            .catch(() => {
                if (!cancelled) setError("Failed to load courses.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [keycloak.token, search, difficulty, category, refreshKey]);

    // Fetch cover image presigned URLs
    useEffect(() => {
        let cancelled = false;
        const coverIds = Array.from(new Set(courses.map(c => c.cover_image).filter(Boolean))) as string[];
        if (coverIds.length === 0) {
            setCoverUrls({});
            return;
        }
        const headers = { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : '' };
        Promise.all(
            coverIds.map(async (id) => {
                try {
                    const res = await fetch(`${API_BASE}/content/${encodeURIComponent(id)}/file-url`, { headers });
                    if (!res.ok) return [id, ''] as const;
                    const data = await res.json() as { url: string | null };
                    return [id, data.url ?? ''] as const;
                } catch {
                    return [id, ''] as const;
                }
            })
        ).then((entries) => {
            if (!cancelled) setCoverUrls(Object.fromEntries(entries.filter(([, v]) => v)));
        }).catch(() => undefined);
        return () => { cancelled = true; };
    }, [courses, keycloak.token]);

    const handleDelete = async (courseId: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!window.confirm("Delete this course?")) return;
        try {
            await deleteCourse(courseId, keycloak.token);
            toast.success("Course deleted.");
            setRefreshKey(k => k + 1);
        } catch {
            toast.error("Could not delete course.");
        }
    };

    // Derive unique categories from courses
    const categoryOptions = ["All", ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="relative h-full overflow-y-auto"
        >
            {/* ── Sticky header + filters ─────────────────────────────────── */}
            <div
                className={`sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/40 px-6 pt-6 pb-4 space-y-4 transition-all duration-500 ease-in-out ${headerVisible
                    ? "opacity-100 translate-y-0 shadow-none"
                    : "opacity-0 -translate-y-full pointer-events-none shadow-md"
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Courses</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Browse and complete security training courses assigned to your organization.
                        </p>
                    </div>
                    {showNewCourse && (
                        <Link
                            to={"/content-manager/courses/new" as any}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-primary to-accent-gradient-end text-white text-sm font-semibold shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200 active:scale-[0.97]"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            New Course
                        </Link>
                    )}
                </div>

                <CourseFilters
                    search={search}
                    onSearchChange={setSearch}
                    primaryFilterValue={difficulty}
                    primaryFilterOptions={["All", "Easy", "Medium", "Hard"]}
                    onPrimaryFilterChange={setDifficulty}
                    primaryLabel="All Difficulties"
                    secondaryFilterValue={category}
                    secondaryFilterOptions={categoryOptions}
                    onSecondaryFilterChange={setCategory}
                    secondaryLabel="All Categories"
                    cols={cols}
                    onColsChange={setCols}
                    resultCount={courses.length}
                    entityName="course"
                />
            </div>

            {/* ── Content Area ──────────────────────────────────────────────── */}
            <div className="px-6 pt-4 pb-6">
                {loading ? (
                    <div className={`grid ${gridClass[cols]} gap-6`}>
                        {Array.from({ length: 6 }, (_, i) => (
                            <div key={i} className="h-64 rounded-xl bg-surface animate-pulse border border-border" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-sm font-medium text-red-400">{error}</p>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/70">
                        <div className="w-16 h-16 rounded-full bg-surface-subtle flex items-center justify-center mb-4">
                            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        {search.trim() ? (
                            <>
                                <p className="text-sm font-medium text-muted-foreground">No courses match "{search}"</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term or reset filters.</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-muted-foreground">No courses yet</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Create your first course to get started.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <LayoutGroup>
                        <motion.div layout className={`grid ${gridClass[cols]} gap-6`}>
                            <AnimatePresence mode="popLayout">
                                {courses.map((course) => (
                                    <motion.div
                                        key={course.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{
                                            y: -4,
                                            scale: 1.02,
                                            boxShadow: "0 12px 28px -6px rgba(147, 51, 234, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.06)"
                                        }}
                                        transition={{
                                            layout: { type: "spring", stiffness: 300, damping: 30 },
                                            opacity: { duration: 0.2 },
                                            scale: { duration: 0.2 },
                                            y: { type: "spring", stiffness: 400, damping: 25 },
                                            boxShadow: { duration: 0.25 }
                                        }}
                                        className="rounded-xl cursor-pointer relative group/card"
                                    >
                                        <ModuleCard
                                            title={course.title}
                                            category={course.category}
                                            description={course.description}
                                            coverImage={course.cover_image ? coverUrls[course.cover_image] : undefined}
                                            estimatedTime={course.expected_time ? `${course.expected_time} min` : undefined}
                                            difficulty={course.difficulty}
                                            onClick={() => navigate({ to: `${basePath}/$courseId`, params: { courseId: course.id } } as any)}
                                            onPreview={showControls ? () => navigate({ to: `/content-manager/courses/$courseId`, params: { courseId: course.id } } as any) : undefined}
                                            onEdit={showControls ? () => navigate({ to: `/content-manager/courses/$courseId/edit`, params: { courseId: course.id } } as any) : undefined}
                                            onDelete={showControls ? () => void handleDelete(course.id) : undefined}
                                            layout={cols === 1 ? 'list' : 'grid'}
                                            showActions={showControls}
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
