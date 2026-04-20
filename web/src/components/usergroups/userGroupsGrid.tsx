import { Users } from "lucide-react";
import { UserGroupCard } from "./userGroupCard";

type Props = {
  groups: { id?: string; name?: string; memberCount?: number; color?: string; lastUpdated?: string }[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
};

export default function UserGroupsGrid({ groups, isLoading, onDelete }: Props) {
  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading groups...</div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="py-12 text-center">
        <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-[14px] font-medium text-muted-foreground">No user groups found</p>
        <p className="text-[13px] text-muted-foreground/70 mt-1">Create your first group to get started</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map((group, index) => (
          <UserGroupCard
            key={group.id || index}
            {...group}
            memberCount={group.memberCount ?? 0}
            onDelete={() => onDelete?.(group.id || "group")}
          />
        ))}
      </div>
    </div>
  );
}
