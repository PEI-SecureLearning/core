import { memo } from "react";
import { Mail, Loader2, Trash2, UserPlus } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";

interface Member {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface GroupMembersTableProps {
  readonly members: Member[];
  readonly isLoading: boolean;
  readonly onRemove: (memberId: string) => void;
  readonly onAddClick: () => void;
}

const MemberRow = memo(function MemberRow({
  member,
  isLoading,
  onRemove,
}: {
  member: Member;
  isLoading: boolean;
  onRemove: (id: string) => void;
}) {
  const fullName =
    `${member.firstName || ""} ${member.lastName || ""}`.trim() ||
    member.username ||
    "Unknown";

  return (
    <tr className="hover:bg-surface-subtle/60 transition-colors border-b border-border/60 last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={member.firstName || member.username || "U"} size="sm" shape="rounded" />
          <div>
            <p className="font-medium text-[14px] text-foreground">{fullName}</p>
            <p className="text-[12px] text-muted-foreground">@{member.username || "—"}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
          <Mail size={14} className="text-muted-foreground/70" />
          {member.email || "—"}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          disabled={isLoading || !member.id}
          onClick={() => member.id && onRemove(member.id)}
          className="p-2 text-muted-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Remove from group"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </td>
    </tr>
  );
});

export function GroupMembersTable({
  members,
  isLoading,
  onRemove,
  onAddClick,
}: GroupMembersTableProps) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Table header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-subtle/80">
        <div>
          <h2 className="text-[14px] font-semibold text-foreground uppercase tracking-wider">Members</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {members.length} {members.length === 1 ? "member" : "members"} in this group
          </p>
        </div>
        <button
          onClick={onAddClick}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-60 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Member</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-subtle/80 border-b border-border/60">
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isLoading={isLoading}
                onRemove={onRemove}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {members.length === 0 && !isLoading && (
        <div className="py-12 text-center">
          <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary/60" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No members yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Add members to get started</p>
        </div>
      )}
    </div>
  );
}
