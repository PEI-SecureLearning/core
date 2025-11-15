import { UserGroupCard } from "./userGroupCard";

// Example usage with multiple cards
export default function UserGroupsGrid() {
  const groups = [
    { id: "1", name: "Marketing Team", memberCount: 24, color: "purple", lastUpdated: "2 days ago" },
    { id: "2", name: "Sales Department", memberCount: 18, color: "blue", lastUpdated: "1 week ago" },
    { id: "3", name: "Engineering", memberCount: 42, color: "green", lastUpdated: "3 days ago" },
    { id: "4", name: "HR & Admin", memberCount: 8, color: "pink", lastUpdated: "5 days ago" },
    { id: "5", name: "Customer Support", memberCount: 15, color: "orange", lastUpdated: "1 day ago" },
    { id: "6", name: "Product Team", memberCount: 12, color: "teal", lastUpdated: "4 days ago" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map((group, index) => (
          <UserGroupCard
            key={index}
            {...group}
            onEdit={() => console.log(`Edit ${group.name}`)}
            onDelete={() => console.log(`Delete ${group.name}`)}
          />
        ))}
      </div>
    </div>
  );
}