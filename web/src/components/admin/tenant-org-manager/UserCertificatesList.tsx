import { AlertTriangle, Award, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserCertificateDto } from "@/types/tenantOrgManager";
import { formatCertificateDate } from "./userDetailsUtils";

// ─── Individual certificate card ──────────────────────────────────────────────

function CertificateCard({ certificate }: { readonly certificate: UserCertificateDto }) {
  return (
    <div
      key={`${certificate.user_id}-${certificate.course_id}`}
      className="group flex items-stretch gap-0 overflow-hidden rounded-xl border border-border/60 bg-surface-subtle shadow-sm transition-all hover:border-primary/30 hover:bg-background"
    >
      <div
        className={`flex shrink-0 items-center justify-center px-4 ${
          certificate.expired ? "text-error" : "bg-primary text-primary-foreground"
        }`}
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full">
          <Award
            className={`size-full ${certificate.expired ? "text-error" : "text-primary-foreground"}`}
          />
        </span>
      </div>

      <div className="w-px self-stretch bg-border/60" aria-hidden="true" />

      <div className="min-w-0 flex-1 px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/courses/manage/$courseId"
                params={{ courseId: certificate.course_id.toString() }}
                className="truncate text-sm font-semibold text-primary hover:underline"
              >
                {certificate.course_name || "Untitled course"}
              </Link>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex items-center"
                      aria-label={
                        certificate.expired ? "Expired certificate" : "Active certificate"
                      }
                    >
                      {certificate.expired ? (
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    {certificate.expired
                      ? "This certificate has expired."
                      : "This certificate is active."}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {certificate.category || "Uncategorized"}
              {certificate.difficulty ? ` · ${certificate.difficulty}` : ""}
            </p>
          </div>

          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <p>Issued {formatCertificateDate(certificate.last_emission_date)}</p>
            <p className="mt-1">
              Expires{" "}
              {certificate.expiration_date
                ? formatCertificateDate(certificate.expiration_date)
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface UserCertificatesListProps {
  readonly certificates: UserCertificateDto[];
  readonly loading: boolean;
  readonly error: string | null;
}

export function UserCertificatesList({ certificates, loading, error }: UserCertificatesListProps) {
  let content: React.ReactNode;

  if (loading) {
    content = (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading certificates...
      </div>
    );
  } else if (error) {
    content = <div className="p-4 text-sm text-error">{error}</div>;
  } else if (certificates.length === 0) {
    content = (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
        <Award className="h-10 w-10 text-primary/40" />
        <p className="text-sm font-medium text-foreground">No certificates found</p>
        <p className="text-xs">This user has not earned any certificates yet.</p>
      </div>
    );
  } else {
    content = (
      <div className="grid gap-3 lg:grid-cols-2 border-0">
        {certificates.map((certificate) => (
          <CertificateCard
            key={`${certificate.user_id}-${certificate.course_id}`}
            certificate={certificate}
          />
        ))}
      </div>
    );
  }

  return <section className="rounded-xl overflow-hidden">{content}</section>;
}
