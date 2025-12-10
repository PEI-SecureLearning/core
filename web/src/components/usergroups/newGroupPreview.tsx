import { memo } from "react";
import { Users } from 'lucide-react';

interface PreviewSidebarProps {
  groupName: string;
  selectedColor: string;
  selectedColorClass: string;
  selectedMembersCount: number;
  description: string;
}

// Memoized preview avatar
const PreviewAvatar = memo(function PreviewAvatar({ colorClass }: { colorClass: string }) {
  return (
    <div className={`liquid-avatar h-20 w-20 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-xl mb-4`}>
      <Users className="h-10 w-10 text-white drop-shadow-sm" />
    </div>
  );
});

// Memoized info row
const InfoRow = memo(function InfoRow({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string | number;
  colorClass?: string;
}) {
  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 transition-colors hover:bg-white/60">
      <span className="text-gray-600 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {colorClass && (
          <div className={`h-4 w-4 rounded-full bg-gradient-to-br ${colorClass} shadow-sm`}></div>
        )}
        <span className="font-semibold text-gray-800 capitalize">{value}</span>
      </div>
    </div>
  );
});

// Main component
function Preview({
  groupName,
  selectedColor,
  selectedColorClass,
  selectedMembersCount,
  description
}: PreviewSidebarProps) {
  return (
    <div className="liquid-glass-card h-full p-6 flex flex-col relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-glow">
          <Users className="h-5 w-5 text-white" />
        </div>
        <h3 className="font-semibold text-gray-800 text-lg tracking-tight">Preview</h3>
      </div>

      <div className="flex-1 space-y-5">
        {/* Group Icon Preview Card */}
        <div className="flex flex-col items-center p-5 bg-gradient-to-br from-white/60 to-purple-50/40 rounded-2xl border border-white/50 backdrop-blur-sm">
          <PreviewAvatar colorClass={selectedColorClass} />
          <p className="font-semibold text-gray-800 text-center text-lg">
            {groupName || 'Group Name'}
          </p>
          <div className="member-badge mt-2 px-3 py-1 bg-purple-100/80 rounded-full">
            <p className="text-sm text-purple-700 font-medium">
              {selectedMembersCount} {selectedMembersCount === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-3 text-sm">
          <InfoRow label="Color" value={selectedColor} colorClass={selectedColorClass} />
          <InfoRow label="Members" value={selectedMembersCount} />

          {/* Description Preview */}
          {description && (
            <div className="pt-3 mt-3 border-t border-purple-200/50">
              <p className="text-gray-600 mb-2 font-medium flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                Description
              </p>
              <div className="purple-scrollbar rounded-xl p-4 bg-gradient-to-br from-white/50 to-purple-50/30 backdrop-blur-sm border border-white/40 max-h-32 overflow-y-auto">
                <p className="text-gray-700 text-sm leading-relaxed">
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