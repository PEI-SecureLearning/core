import { memo, useCallback } from "react";
import { Users, X, UserPlus, Search, Upload } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";

const API_BASE = import.meta.env.VITE_API_URL;

interface Member {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface MembersSectionProps {
  searchQuery: string;
  filteredUsers: Member[];
  selectedMembers: Member[];
  selectedColorClass: string;
  setSelectedMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  onSearchChange: (query: string) => void;
  onAddMember: (user: Member) => void;
  onRemoveMember: (userId: string) => void;
  onStatus?: (msg: string) => void;
}

// Memoized member avatar - prevents re-render during list animations
const MemberAvatar = memo(function MemberAvatar({
  name,
  colorClass,
}: {
  name: string;
  colorClass: string;
}) {
  const initials = name.split(" ").map((n) => n[0]).join("");
  return (
    <div
      className={`liquid-avatar h-10 w-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-md`}
    >
      {initials}
    </div>
  );
});

// Memoized member row - isolated from list animation
const MemberRow = memo(function MemberRow({
  member,
  colorClass,
  onRemove,
}: {
  member: Member;
  colorClass: string;
  onRemove: () => void;
}) {
  return (
    <div className="liquid-list-item flex items-center justify-between p-3">
      <div className="flex items-center gap-3 min-w-0">
        <MemberAvatar name={member.name} colorClass={colorClass} />
        <div className="min-w-0">
          <p className="font-medium text-gray-800 truncate">{member.name}</p>
          <p className="text-sm text-gray-500 truncate">{member.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50/80 rounded-xl transition-transform hover:scale-110 active:scale-95"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});

// Memoized search result row
const SearchResultRow = memo(function SearchResultRow({
  user,
  onAdd,
}: {
  user: Member;
  onAdd: () => void;
}) {
  const initials = user.name.split(" ").map((n) => n[0]).join("");
  return (
    <button
      type="button"
      onClick={onAdd}
      className="liquid-list-item w-full px-4 py-3 flex items-center justify-between border-b border-purple-100/30 last:border-0 rounded-none first:rounded-t-xl last:rounded-b-xl"
    >
      <div className="flex items-center gap-3 text-left min-w-0">
        <div className="liquid-avatar h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-md">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-800 truncate">{user.name}</p>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
        </div>
      </div>
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
        <UserPlus className="h-4 w-4 text-purple-600" />
      </div>
    </button>
  );
});

// Memoized empty state
const EmptyState = memo(function EmptyState() {
  return (
    <div className="text-center py-10 rounded-xl bg-gradient-to-br from-white/40 to-purple-50/30 border border-white/40 backdrop-blur-sm">
      <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center animate-pulse-glow">
        <Users className="h-8 w-8 text-purple-300" />
      </div>
      <p className="text-sm font-medium text-gray-600">No members added yet</p>
      <p className="text-xs text-gray-400 mt-1">Search and add members to this group</p>
    </div>
  );
});

// Memoized selected members list
const SelectedMembersList = memo(function SelectedMembersList({
  members,
  colorClass,
  onRemove,
}: {
  members: Member[];
  colorClass: string;
  onRemove: (id: string) => void;
}) {
  if (members.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2 max-h-[40vh] purple-scrollbar overflow-y-auto pr-1">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          colorClass={colorClass}
          onRemove={() => onRemove(member.id)}
        />
      ))}
    </div>
  );
});

// Main component - animation surface container
function MembersSection({
  searchQuery,
  filteredUsers,
  selectedMembers,
  selectedColorClass,
  setSelectedMembers,
  onSearchChange,
  onAddMember,
  onRemoveMember,
  onStatus,
}: MembersSectionProps) {
  const { keycloak } = useKeycloak();
  const handleFileSelect = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/org-manager/upload`, {
        method: "POST",
        headers: {
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload CSV");
      const data: Member[] = await res.json();
      setSelectedMembers(data);
      onStatus?.(`Imported ${data.length} users from CSV`);
    } catch (err) {
      console.error(err);
      onStatus?.("Error uploading CSV");
    }
  }, [setSelectedMembers, onStatus, keycloak.token]);

  return (
    <div className="liquid-glass-card p-6 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">Add Members</h2>
        <label className="liquid-glass-button-secondary flex items-center gap-2 px-4 py-2.5 cursor-pointer text-sm">
          <Upload className="h-4 w-4" />
          Import CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
        <input
          type="text"
          value={searchQuery}
          placeholder="Search by name, email, or department..."
          className="liquid-glass-input w-full pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Search Results Dropdown */}
      {searchQuery && filteredUsers.length > 0 && (
        <div className="mb-5 max-h-60 purple-scrollbar overflow-y-auto rounded-xl border border-purple-200/50 bg-white/60 backdrop-blur-md">
          {filteredUsers.slice(0, 5).map((user) => (
            <SearchResultRow
              key={user.id}
              user={user}
              onAdd={() => onAddMember(user)}
            />
          ))}
        </div>
      )}

      {/* Selected Members Section */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
          Selected Members ({selectedMembers.length})
        </p>
        <SelectedMembersList
          members={selectedMembers}
          colorClass={selectedColorClass}
          onRemove={onRemoveMember}
        />
      </div>
    </div>
  );
}

export default memo(MembersSection);
