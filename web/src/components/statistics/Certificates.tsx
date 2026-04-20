import { useState, useEffect } from "react";
import { ExternalLink, Award, Loader2 } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";
import { fetchEnrolledCourses } from "@/services/coursesApi";
import { getUserProgress } from "@/services/progressApi";

export default function CertificatesList() {
  const { keycloak } = useKeycloak();
  const [certificates, setCertificates] = useState<{ id: string; name: string; validUntil: string; href: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = keycloak.subject || keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.email;
    if (!keycloak.authenticated || !keycloak.token || !userId) return;

    async function loadCertificates() {
      try {
        const [enrolledCourses, progresses] = await Promise.all([
          fetchEnrolledCourses(userId, keycloak.token!),
          getUserProgress(userId, keycloak.token!).catch(() => [])
        ]);

        const certified = enrolledCourses
          .filter(course => progresses.find(p => p.course_id === course.id)?.is_certified)
          .map(course => {
            const progress = progresses.find(p => p.course_id === course.id);
            return {
              id: course.id,
              name: course.title,
              validUntil: progress?.deadline ? new Date(progress.deadline).toLocaleDateString() : "No expiration",
              href: `/courses/${course.id}`
            };
          });

        setCertificates(certified);
      } catch (err) {
        console.error("Failed to load certificates:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadCertificates();
  }, [keycloak.authenticated, keycloak.token]);

  return (
    <div
      className="flex-1 bg-background/60 backdrop-blur-xl rounded-b-xl border-t-3 border-primary
      shadow-lg shadow-slate-300/50 p-6
      hover:shadow-2xl hover:shadow-purple-200/60
      transition-all duration-500 group min-h-[300px]"
    >
      <style>{`
        @keyframes certSlide {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .cert-row {
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .cert-row:hover {
          transform: translateX(4px);
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Your Certificates
          </h3>
          <p className="text-[13px] text-muted-foreground">
            {loading ? "..." : certificates.length} earned certificates
          </p>
        </div>
      </div>

      {/* Certificates List */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto purple-scrollbar overflow-x-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/50">
            <Award className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium text-foreground/70">No certificates yet</p>
            <p className="text-xs mt-1">Complete courses to earn your certifications.</p>
          </div>
        ) : (
          certificates.map((cert, idx) => (
            <a
              key={cert.id}
              href={cert.href}
              className="cert-row group/row flex items-start sm:items-center justify-between gap-2 p-3.5 rounded-xl
                bg-gradient-to-r from-slate-50/80 to-amber-50/20
                border border-border/40/60
                hover:border-amber-200/70 hover:from-amber-50/60 hover:to-orange-50/40
                hover:shadow-md hover:shadow-amber-100/60"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[14px] font-medium text-foreground/90 group-hover/row:text-amber-700 transition-colors duration-200 break-words">
                  {cert.name}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className="text-[11px] font-semibold text-primary bg-primary/90/8 border border-purple-100/60 px-2.5 py-1 rounded-full
                  group-hover/row:bg-primary/20/60 transition-colors duration-200"
                >
                  Until {cert.validUntil}
                </span>
                <ExternalLink
                  size={13}
                  className="text-muted-foreground/50 group-hover/row:text-amber-500 transition-colors duration-200"
                />
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
