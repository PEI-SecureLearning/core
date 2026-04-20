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
    <div className="text-sm text-muted-foreground px-4 py-2 bg-surface-subtle rounded-xl border border-border">
      <span className="inline-block w-2 h-2 bg-accent-secondary rounded-full mr-2 animate-pulse"></span>
      {status}
    </div>
  );
});

// Main component
function NewGroupFooter({
  onSubmit,
  groupName,
  selectedMembersCount: _selectedMembersCount,
  isLoading,
  status
}: NewGroupFooterProps) {
  // Allow creating a group without pre-selecting users; only block when no name or loading.
  const isDisabled = !groupName || isLoading;

  return (
    <div className="flex flex-col gap-3 px-6 relative z-10">
      {/* Status Message */}
      {status && <StatusMessage status={status} />}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Link
          to="/usergroups"
          className="px-6 py-2.5 rounded-lg text-sm font-medium border border-border bg-surface hover:bg-surface-subtle text-foreground transition-colors"
        >
          Cancel
        </Link>
        <button
          id="create-group-btn"
          onClick={onSubmit}
          disabled={isDisabled}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
