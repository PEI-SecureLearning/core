import { UserGroupCard } from "./userGroupCard";

type Props = {
  groups: { id?: string; name?: string; memberCount?: number; color?: string; lastUpdated?: string }[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
};

export default function UserGroupsGrid({ groups, isLoading, onDelete }: Props) {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {isLoading ? (
        <div className="text-sm text-gray-600">Loading groups...</div>
      ) : groups.length === 0 ? (
        <div className="text-sm text-gray-500">No groups found.</div>
      ) : (
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
      )}
    </div>
  );
}
