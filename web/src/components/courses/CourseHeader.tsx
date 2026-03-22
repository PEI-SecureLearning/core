import { useState } from "react";
import { ChevronDown, Clock, Users } from "lucide-react";
import type { Course } from "./courseData";

const difficultyBadge: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700",
  Intermediate: "bg-primary/20 text-primary",
  Advanced: "bg-red-100 text-red-700"
};

type CourseHeaderProps = {
  course: Course & { coverImage?: string | null };
  overallProgress: number;
};

export default function CourseHeader({
  course,
  overallProgress
}: CourseHeaderProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative z-10 rounded-b-lg border-l-4 border-primary ring-1 ring-gray-200 bg-background shadow-md overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left content */}
        <div className="flex-1 p-4 lg:p-5 space-y-2">
          {/* Badges + title row + toggle */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-2 min-w-0">
              {/* Title */}
              <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-tight">
                {course.title}
              </h1>
            </div>

            {/* Collapse toggle */}
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="shrink-0 mt-1 rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-surface-subtle transition-colors"
              title={collapsed ? "Expand" : "Collapse"}
              aria-label={
                collapsed ? "Expand course info" : "Collapse course info"
              }
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${collapsed ? "rotate-180" : "rotate-0"}`}
              />
            </button>
          </div>

          {/* Collapsible content */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? "max-h-0 opacity-0" : "max-h-96 opacity-100"}`}
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyBadge[course.difficulty || 'Beginner']}`}
              >
                {course.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                {course.modules.length} Modules
              </span>
            </div>
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {course.description}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-5 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-primary/90" />
                {course.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={15} className="text-primary/90" />
                {course.userCount ?? 0} Users
              </span>
            </div>

            {/* Progress */}
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Course Progress
                </span>
                <span className="text-xs font-bold text-primary">
                  {overallProgress}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-700 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right illustration area — hide when collapsed */}
        {!collapsed && (
          <div
            className={`hidden lg:flex items-center justify-center w-64 flex-shrink-0 ${course.coverImage ? '' : `bg-gradient-to-br ${course.color} bg-opacity-10`}`}
          >
            {course.coverImage ? (
                <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-24 h-24 rounded-2xl bg-primary/30 flex items-center justify-center">
                  <span className="text-4xl select-none">{course.icon}</span>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
