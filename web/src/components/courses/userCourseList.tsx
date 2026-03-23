import { useState, useRef, useCallback, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { useKeycloak } from "@react-keycloak/web";
import { fetchEnrolledCourses, type Course } from "@/services/coursesApi";
import { getUserProgress, type UserProgress } from "@/services/progressApi";
import CourseCard, { type CardItem } from "./CourseCard";
import CourseFilters from "./UniversalFilters";
import type { GridCols } from "./UniversalFilters";

const API_BASE = import.meta.env.VITE_API_URL as string;

const gridClass: Record<GridCols, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
};

export default function UserCourseList() {
    const { keycloak } = useKeycloak();

    const [courses, setCourses] = useState<(Course & { progressObj: UserProgress })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});

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
        if (Math.abs(delta) > 4) {
            setHeaderVisible(delta < 0 || current < 10);
            lastScrollY.current = current;
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const userId = keycloak.subject || keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.email;
        console.log(userId);

        if (!keycloak.authenticated || !keycloak.token || !userId) return;

        setLoading(true);
        setError(null);

        async function loadData() {
            try {
                await keycloak.updateToken(30);

                const [enrolledCourses, progresses] = await Promise.all([
                    fetchEnrolledCourses(userId, keycloak.token!, true),
                    getUserProgress(userId, keycloak.token!, true).catch(() => [])
                ]);

                if (!cancelled && enrolledCourses.length === 0) {
                    setCourses([]);
                    return;
                }

                const fetched = enrolledCourses.map(course => {
                    const progressObj = progresses.find(p => p.course_id === course.id) ?? {
                        course_id: course.id,
                        user_id: userId,
                        completed_sections: [],
                        is_certified: false,
                        status: 'ACTIVE',
                        progress_data: {},
                        total_completed_tasks: 0,
                        deadline: null,
                        start_date: null,
                        cert_valid_days: 365,
                        cert_expires_at: null,
                        overdue: false,
                        expired: false,
                        updated_at: new Date().toISOString(),
                    } as UserProgress;

                    return { ...course, progressObj };
                });

                if (!cancelled) setCourses(fetched);
            } catch (err) {
                if (!cancelled) setError("Failed to load your courses.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadData();
        return () => { cancelled = true; };
    }, [keycloak.authenticated, keycloak.token]);

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

    const filteredCourses = courses.filter((c) => {
        if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (category !== "All" && c.category !== category) return false;
        if (difficulty !== "All" && c.difficulty !== difficulty) return false;
        return true;
    });

    const sortedCourses = [...filteredCourses].sort((a, b) => {
        const getPriority = (p: any) => {
            if (p.is_certified) return 2; // Bottom
            if (p.status === 'OVERDUE' || p.overdue) return 0; // Top
            return 1; // Middle
        };
        return getPriority(a.progressObj) - getPriority(b.progressObj);
    });

    const categoryOptions = ["All", ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];

    function courseToCardItem(course: Course & { progressObj: UserProgress }): CardItem {
        const p = course.progressObj;
        let progNum = 0;
        if (p.is_certified) {
            progNum = 100;
        } else if (course.modules.length > 0) {
            progNum = Math.min(100, Math.round((p.completed_sections.length / course.modules.length) * 100));
        }

        const isOverdue = p.status === 'OVERDUE' || p.overdue;
        const isRenewalRequired = p.status === 'RENEWAL_REQUIRED';
        const isExpired = p.expired; // Keep expired reference but it's separate now

        let badgeStatus: string | undefined;
        let badgeClass: string | undefined;

        if (isRenewalRequired) {
            badgeStatus = "Renewal Required";
            badgeClass = "bg-amber-500 text-white border-amber-600 font-bold shadow-sm";
        } else if (isOverdue) {
            badgeStatus = "Overdue";
            badgeClass = "bg-red-600 text-white border-red-700 font-extrabold shadow-sm";
        }

        return {
            id: course.id,
            title: course.title,
            description: course.description,
            category: course.category,
            duration: course.expected_time,
            unitCount: course.modules.length,
            unitLabel: "modules",
            showProgress: true,
            progress: progNum,
            isCompleted: course.progressObj.is_certified,
            isOverdue: isOverdue,
            isExpired: isExpired,
            statusBadge: badgeStatus,
            statusBadgeClass: badgeClass,
            coverImageUrl: course.cover_image ? coverUrls[course.cover_image] : undefined,
        };
    }

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="relative h-full overflow-y-auto"
        >
            <div
                className={`sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/40 px-6 pt-6 pb-4 space-y-4 transition-all duration-500 ease-in-out ${headerVisible
                    ? "opacity-100 translate-y-0 shadow-none"
                    : "opacity-0 -translate-y-full pointer-events-none shadow-md"
                    }`}
            >
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Continue your assigned learning and track your progress.
                    </p>
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
                    resultCount={filteredCourses.length}
                    entityName="course"
                />
            </div>

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
                            <GraduationCap className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-base font-medium text-foreground">No courses assigned</p>
                        <p className="text-sm text-muted-foreground mt-1">You haven't been assigned any training yet.</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground/70">
                        <p className="text-sm font-medium text-muted-foreground">No courses match your filters</p>
                    </div>
                ) : (
                    <LayoutGroup>
                        <motion.div layout className={`grid ${gridClass[cols]} gap-6`}>
                            <AnimatePresence mode="popLayout">
                                {sortedCourses.map((course) => (
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
                                        <CourseCard
                                            item={courseToCardItem(course)}
                                            cols={cols}
                                            basePath="/courses"
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
