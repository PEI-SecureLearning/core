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
  setSelectedMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  onSearchChange: (query: string) => void;
  onAddMember: (user: Member) => void;
  onRemoveMember: (userId: string) => void;
  onStatus?: (msg: string) => void;
}

// Memoized member avatar
const MemberAvatar = memo(function MemberAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("");
  return (
    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
      {initials}
    </div>
  );
});

// Memoized member row
const MemberRow = memo(function MemberRow({
  member,
  onRemove,
}: {
  member: Member;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle border border-border">
      <div className="flex items-center gap-3 min-w-0">
        <MemberAvatar name={member.name} />
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{member.name}</p>
          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-transform hover:scale-110 active:scale-95"
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
      data-testid={`user-result-${user.email}`}
      onClick={onAdd}
      className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted transition-colors border-b border-border last:border-0"
    >
      <div className="flex items-center gap-3 text-left min-w-0">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{user.name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
        <UserPlus className="h-4 w-4 text-primary" />
      </div>
    </button>
  );
});

// Memoized empty state
const EmptyState = memo(function EmptyState() {
  return (
    <div className="text-center py-10 rounded-xl bg-surface-subtle border border-border">
      <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
        <Users className="h-8 w-8 text-accent-secondary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">No members added yet</p>
      <p className="text-xs text-muted-foreground/70 mt-1">Search and add members to this group</p>
    </div>
  );
});

// Memoized selected members list
const SelectedMembersList = memo(function SelectedMembersList({
  members,
  onRemove,
}: {
  members: Member[];
  onRemove: (id: string) => void;
}) {
  if (members.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
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
    <div className="bg-surface border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Add Members</h2>
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-subtle text-foreground text-sm font-medium transition-colors cursor-pointer">
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
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent-secondary" />
        <input
          id="member-search-input"
          type="text"
          value={searchQuery}
          placeholder="Search by name, email, or department..."
          className="w-full pl-11 pr-4 py-3 rounded-md bg-surface-subtle border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Search Results Dropdown */}
      {searchQuery && filteredUsers.length > 0 && (
        <div className="mb-5 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface">
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
        <p className="text-sm font-semibold text-foreground/90 mb-3 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-accent-secondary rounded-full"></span>
          Selected Members ({selectedMembers.length})
        </p>
        <SelectedMembersList
          members={selectedMembers}
          onRemove={onRemoveMember}
        />
      </div>
    </div>
  );
}

export default memo(MembersSection);
