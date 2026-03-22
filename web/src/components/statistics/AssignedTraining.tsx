import React, { useState, useEffect } from "react";
import { ChevronRight, X, Loader2, BookOpen } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";
import { fetchEnrolledCourses } from "@/services/coursesApi";
import { getUserProgress } from "@/services/progressApi";

interface AssignedTrainingProps {
  className?: string;
}

const AssignedTraining: React.FC<AssignedTrainingProps> = ({
  className = ""
}) => {
  const { keycloak } = useKeycloak();
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ assigned: 0, total: 0 });
  const [courseList, setCourseList] = useState<{ name: string; done: boolean; href: string }[]>([]);

  useEffect(() => {
    const userId = keycloak.subject || keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.email;
    if (!keycloak.authenticated || !keycloak.token || !userId) return;

    async function loadData() {
      try {
        const [enrolledCourses, progresses] = await Promise.all([
          fetchEnrolledCourses(userId, keycloak.token!),
          getUserProgress(userId, keycloak.token!).catch(() => [])
        ]);

        const mapped = enrolledCourses.map(c => {
          const prog = progresses.find(p => p.course_id === c.id);
          return {
            name: c.title,
            done: !!prog?.is_certified,
            href: `/courses/${c.id}`
          };
        });

        const completedCount = mapped.filter(c => c.done).length;
        
        setStats({ assigned: completedCount, total: mapped.length });
        setCourseList(mapped);
      } catch (err) {
        console.error("Failed to load assigned training stats:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [keycloak.authenticated, keycloak.token]);

  const assigned = stats.assigned;
  const total = stats.total;
  const completionRate = total > 0 ? Math.round((assigned / total) * 100) : 0;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes barShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes progressPop {
          0% { transform: scaleY(1); }
          40% { transform: scaleY(1.4); }
          70% { transform: scaleY(0.9); }
          100% { transform: scaleY(1); }
        }
        .row-slide {
          transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
        }
        .row-slide:hover {
          transform: translateX(3px);
        }
      `}</style>

      <div
        className={`flex-1 bg-background/60 backdrop-blur-xl rounded-b-xl border-t-3 border-primary
          shadow-lg shadow-slate-300/50 p-5 min-h-[220px] flex flex-col justify-center
          hover:shadow-2xl hover:shadow-purple-200/60
          transition-all duration-500 hover:-translate-y-1 group ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-foreground">
            Assigned Training
          </h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          </div>
        ) : (
          <>
            {/* Progress Display */}
            <div className="flex items-baseline gap-1 mb-1">
              <span
                className="text-4xl sm:text-5xl font-bold text-primary transition-all duration-300"
                style={{
                  textShadow: isHovered
                    ? "0 0 20px rgba(139, 92, 246, 0.35)"
                    : "none",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                  display: "inline-block",
                  transition: "text-shadow 0.4s ease, transform 0.3s ease"
                }}
              >
                {assigned}
              </span>
              <span className="text-xl text-muted-foreground/70 mx-0.5">/</span>
              <span className="text-2xl font-semibold text-muted-foreground">
                {total}
              </span>
            </div>

            <p className="text-[12px] text-muted-foreground mb-3 font-medium">
              courses completed
            </p>

            {/* Progress Bar */}
            <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden mb-1">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-purple-400 via-violet-400 to-purple-600 transition-all duration-700 ease-out"
                style={{
                  width: `${completionRate}%`,
                  boxShadow: isHovered
                    ? "0 0 12px rgba(139, 92, 246, 0.4), 0 0 6px rgba(139, 92, 246, 0.25)"
                    : "none",
                  backgroundSize: "200% auto",
                  animation: isHovered ? "barShimmer 1.8s linear infinite" : "none",
                  transition: "box-shadow 0.4s ease"
                }}
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] text-primary/90 font-semibold">
                {completionRate}% complete
              </span>
              <span className="text-[11px] text-muted-foreground/70">
                {total - assigned} remaining
              </span>
            </div>

            {/* Details Button */}
            <button
              onClick={() => setShowModal(true)}
              className="group/btn w-fit flex items-center gap-1.5 text-[13px] font-semibold text-primary
                hover:text-primary transition-all duration-200 cursor-pointer
                bg-primary/10 hover:bg-primary/20 border border-purple-100 hover:border-primary/30
                px-3 py-1.5 rounded-lg"
            >
              View details
              <ChevronRight
                size={14}
                className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
              />
            </button>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm px-4"
          style={{ animation: "fadeIn 0.2s ease-out" }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className="bg-background/95 backdrop-blur-2xl rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/60"
            style={{
              animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-lg font-semibold text-foreground">
                  Assigned Courses
                </h4>
                <p className="text-[12px] text-muted-foreground">
                  {assigned}/{total} completed
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group/close"
              >
                <X
                  size={18}
                  className="text-muted-foreground/70 group-hover/close:text-muted-foreground transition-colors group-hover/close:rotate-90 transition-transform duration-200"
                />
              </button>
            </div>

            {/* Mini progress bar in modal */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto purple-scrollbar">
              {courseList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50">
                   <BookOpen className="w-8 h-8 opacity-20 mb-2" />
                   <p className="text-sm italic">No courses assigned yet</p>
                </div>
              ) : (
                courseList.map((course, idx) => (
                  <a
                    key={idx}
                    href={course.href}
                    className="row-slide flex items-center justify-between p-3 rounded-xl
                      bg-surface-subtle/80 hover:bg-primary/20 border border-transparent hover:border-purple-100/60
                      group/row"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${course.done ? "bg-emerald-500" : "bg-amber-400"}`}
                      />
                      <span className="text-[14px] font-medium text-foreground/90 group-hover/row:text-primary transition-colors">
                        {course.name}
                      </span>
                    </div>
                    {course.done ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10">
                        <span className="text-[11px] font-semibold text-emerald-600">
                          Done
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10">
                        <span className="text-[11px] font-semibold text-amber-600">
                          Pending
                        </span>
                      </div>
                    )}
                  </a>
                ))
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl
                font-semibold text-[14px] hover:from-purple-700 hover:to-violet-700
                transition-all duration-200 shadow-lg shadow-purple-500/25
                hover:shadow-purple-500/40 hover:-translate-y-0.5 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AssignedTraining;
