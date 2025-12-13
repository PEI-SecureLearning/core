import { memo } from "react";
import { Send, Server, Globe } from "lucide-react";

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
    <div className="flex justify-between items-center p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 transition-colors hover:bg-white/60">
      <span className="text-gray-600 font-medium text-sm">{label}</span>
      <span className="font-semibold text-gray-800 text-sm truncate max-w-[150px]">
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
    <div className="liquid-glass-card h-full p-6 flex flex-col relative z-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-glow">
          <Send className="h-5 w-5 text-white pl-0.5" />
        </div>
        <h3 className="font-semibold text-gray-800 text-lg tracking-tight">
          Preview
        </h3>
      </div>

      <div className="flex-1 space-y-5">
        {/* Visual Card */}
        <div className="flex flex-col items-center p-6 bg-gradient-to-br from-white/60 to-blue-50/40 rounded-2xl border border-white/50 backdrop-blur-sm">
          <div className="liquid-avatar h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-xl mb-4 text-white text-2xl font-bold">
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
          <p className="font-semibold text-gray-800 text-center text-lg break-all">
            {name || "Profile Name"}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            {fromEmail || "email@example.com"}
          </p>
        </div>

        {/* Technical Details */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
            Configuration
          </p>
          <InfoRow label="SMTP Host" value={smtpHost} />
          <InfoRow label="Port" value={smtpPort} />
          <InfoRow label="Custom Headers" value={headerCount} />
        </div>

        {/* Status Indicator */}
        <div className="mt-auto pt-4 border-t border-white/30">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50/50 p-2 rounded-lg border border-green-100">
            <Globe className="h-4 w-4" />
            <span className="font-medium">Ready to use in campaigns</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ProfilePreview);
