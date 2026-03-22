import { useState, useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { type Course } from '@/services/coursesApi';
import { courseToCardItem } from '@/components/courses/courseList';
import CourseCard from '@/components/courses/CourseCard';
import UniversalFilters, { type GridCols } from '@/components/courses/UniversalFilters';

interface CourseSelectionStepProps {
    courses: Course[];
    selectedCourses: string[];
    onCourseToggle: (id: string) => void;
    coverUrls: Record<string, string>;
}

export default function CourseSelectionStep({ courses, selectedCourses, onCourseToggle, coverUrls }: CourseSelectionStepProps) {
    // Filter states
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState("All");
    const [category, setCategory] = useState("All");
    const [cols, setCols] = useState<GridCols>(2);

    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesSearch = !search ||
                course.title.toLowerCase().includes(search.toLowerCase()) ||
                course.description.toLowerCase().includes(search.toLowerCase());
            const matchesDifficulty = difficulty === "All" || course.difficulty === difficulty;
            const matchesCategory = category === "All" || course.category === category;
            return matchesSearch && matchesDifficulty && matchesCategory;
        });
    }, [courses, search, difficulty, category]);

    const categoryOptions = useMemo(() => {
        return ["All", ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];
    }, [courses]);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-4">
                <div className="bg-surface/50 p-4 rounded-xl border border-border/60">
                    <UniversalFilters
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
            </div>

            <div className="min-h-0 flex-1 pr-2 max-h-[500px]">
                <div className={`grid gap-4 ${cols === 1 ? 'grid-cols-1' :
                    cols === 2 ? 'grid-cols-2' :
                        'grid-cols-3'
                    }`}>
                    {filteredCourses.map(course => (
                        <CourseCard
                            key={course.id}
                            item={{
                                ...courseToCardItem(course),
                                coverImageUrl: course.cover_image ? coverUrls[course.cover_image] : undefined
                            }}
                            cols={cols}
                            selectable={true}
                            isSelected={selectedCourses.includes(course.id)}
                            onClick={() => onCourseToggle(course.id)}
                        />
                    ))}
                </div>
                {filteredCourses.length === 0 && (
                    <div className="py-12 text-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No courses found matching your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
