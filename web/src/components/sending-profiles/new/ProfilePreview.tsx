import { memo } from "react";
import { Send } from "lucide-react";

interface Props {
  name: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  headerCount: number;
}

const InfoRow = memo(function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-subtle border border-border hover:bg-muted transition-colors">
      <span className="text-muted-foreground font-medium text-sm">{label}</span>
      <span className="font-semibold text-foreground text-sm truncate max-w-[150px]">
        {value || "-"}
      </span>
    </div>
  );
});

function ProfilePreview({
  name,
  fromEmail,
  smtpHost,
  smtpPort,
  headerCount,
}: Props) {
  return (
    <div className="bg-surface border border-border rounded-lg h-full p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
          <Send className="h-5 w-5 text-white pl-0.5" />
        </div>
        <h3 className="font-semibold text-foreground text-lg tracking-tight">
          Preview
        </h3>
      </div>

      <div className="flex-1 space-y-5">
        {/* Visual Card */}
        <div className="flex flex-col items-center p-6 bg-surface-subtle rounded-lg border border-border">
          <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center mb-4 text-white text-2xl font-bold">
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
          <p className="font-semibold text-foreground text-center text-lg break-all">
            {name || "Profile Name"}
          </p>
          <p className="text-sm text-primary mt-1">
            {fromEmail || "email@example.com"}
          </p>
        </div>

        {/* Technical Details */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider ml-1">
            Configuration
          </p>
          <InfoRow label="SMTP Host" value={smtpHost} />
          <InfoRow label="Port" value={smtpPort} />
          <InfoRow label="Custom Headers" value={headerCount} />
        </div>
      </div>
    </div>
  );
}

export default memo(ProfilePreview);
