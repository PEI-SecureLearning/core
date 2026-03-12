import { memo } from "react";
import { Users } from 'lucide-react';

interface PreviewSidebarProps {
  groupName: string;
  selectedMembersCount: number;
  description: string;
}

// Memoized preview avatar
const PreviewAvatar = memo(function PreviewAvatar() {
  return (
    <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
      <Users className="h-10 w-10 text-primary" />
    </div>
  );
});

// Memoized info row
const InfoRow = memo(function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-surface-subtle border border-border transition-colors hover:bg-muted">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="font-semibold text-foreground capitalize">{value}</span>
    </div>
  );
});

// Main component
function Preview({
  groupName,
  selectedMembersCount,
  description
}: PreviewSidebarProps) {
  return (
    <div className="bg-surface border border-border rounded-lg h-full p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
          <Users className="h-5 w-5 text-white" />
        </div>
        <h3 className="font-semibold text-foreground text-lg tracking-tight">Preview</h3>
      </div>

      <div className="flex-1 space-y-5">
        {/* Group Icon Preview Card */}
        <div className="flex flex-col items-center p-5 bg-surface-subtle rounded-2xl border border-border">
          <PreviewAvatar />
          <p className="font-semibold text-foreground text-center text-lg">
            {groupName || 'Group Name'}
          </p>
          <div className="mt-2 px-3 py-1 bg-primary/10 rounded-full">
            <p className="text-sm text-primary font-medium">
              {selectedMembersCount} {selectedMembersCount === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-3 text-sm">
          <InfoRow label="Members" value={selectedMembersCount} />

          {/* Description Preview */}
          {description && (
            <div className="pt-3 mt-3 border-t border-border">
              <p className="text-muted-foreground mb-2 font-medium">Description</p>
              <div className="rounded-xl p-4 bg-surface-subtle border border-border max-h-32 overflow-y-auto">
                <p className="text-foreground/90 text-sm leading-relaxed">
                  {description.slice(0, 150)}{description.length > 150 ? '...' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(Preview);