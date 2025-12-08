import { memo } from "react";
import { Link } from '@tanstack/react-router';
import { Save, Loader2 } from 'lucide-react';

interface NewGroupFooterProps {
  onSubmit: () => void;
  groupName: string;
  selectedMembersCount: number;
  isLoading?: boolean;
  status?: string | null;
}

// Memoized status message
const StatusMessage = memo(function StatusMessage({ status }: { status: string }) {
  return (
    <div className="text-sm text-gray-600 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-xl border border-purple-200/30">
      <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
      {status}
    </div>
  );
});

// Main component
function NewGroupFooter({
  onSubmit,
  groupName,
  selectedMembersCount,
  isLoading,
  status
}: NewGroupFooterProps) {
  const isDisabled = !groupName || selectedMembersCount === 0 || isLoading;

  return (
    <div className="flex flex-col gap-3 px-6 relative z-10">
      {/* Status Message */}
      {status && <StatusMessage status={status} />}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Link
          to="/usergroups"
          className="liquid-glass-button-secondary px-6 py-2.5 text-sm"
        >
          Cancel
        </Link>
        <button
          onClick={onSubmit}
          disabled={isDisabled}
          className="liquid-glass-button flex items-center gap-2 px-6 py-2.5 text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Working...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Create Group
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(NewGroupFooter);
