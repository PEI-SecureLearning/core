import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Save, Loader2 } from "lucide-react";

interface Props {
  onSubmit: () => void;
  isValid: boolean;
  isLoading?: boolean;
  status?: string | null;
}

const StatusMessage = memo(function StatusMessage({
  status,
}: {
  status: string;
}) {
  const isError =
    status.toLowerCase().includes("failed") ||
    status.toLowerCase().includes("fill");
  return (
    <div
      className={`text-sm px-4 py-2 bg-white/50 backdrop-blur-sm rounded-xl border ${isError ? "text-red-600 border-red-200/30" : "text-gray-600 border-blue-200/30"}`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full mr-2 animate-pulse ${isError ? "bg-red-500" : "bg-blue-400"}`}
      ></span>
      {status}
    </div>
  );
});

function ProfileFooter({ onSubmit, isValid, isLoading, status }: Props) {
  return (
    <div className="flex flex-col gap-3 px-6 relative z-10">
      {status && <StatusMessage status={status} />}

      <div className="flex gap-4 justify-end">
        <Link
          to="/sending-profiles"
          className="liquid-glass-button-secondary px-6 py-2.5 text-sm"
        >
          Cancel
        </Link>
        <button
          onClick={onSubmit}
          disabled={!isValid || isLoading}
          className="liquid-glass-button bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Create Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(ProfileFooter);
