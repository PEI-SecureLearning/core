import {
  ArrowLeft,
  Users,
  Trash2,
  Send,
  X,
  Search,
} from "lucide-react";
import { Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import {
  fetchGroups,
  fetchGroupMembers,
  addUserToGroup,
  fetchUsers,
  removeUserFromGroup,
  deleteGroup,
} from "@/services/userGroupsApi";
import ConfirmDeleteModal from "@/components/usergroups/ConfirmDeleteModal";
import { GroupMembersTable } from "@/components/usergroups/GroupMembersTable";

interface Member {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  avatar?: string;
}

export default function UserGroupDetail() {
  const params = useParams({ from: "/usergroups/$id" });
  const groupId = params.id;
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState<string>("Group");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [users, setUsers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const tokenRealm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  const realm = tokenRealm || "";

  useEffect(() => {
    const load = async () => {
      if (!realm || !groupId) return;
      setIsLoading(true);
      try {
        const [groupsRes, membersRes] = await Promise.all([
          fetchGroups(realm, keycloak.token || undefined),
          fetchGroupMembers(realm, groupId, keycloak.token || undefined),
        ]);
        const found = (groupsRes.groups || []).find((g) => g.id === groupId);
        setGroupName(found?.name || groupId);
        setMembers(membersRes.members || []);
      } catch (err) {
        console.error(err);
        setStatus("Failed to load group details.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [realm, groupId, keycloak.token]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!realm) return;
      try {
        const res = await fetchUsers(realm, keycloak.token || undefined);
        setUsers(
          (res.users || []).map((u) => ({
            id: u.id || "",
            username: u.username,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
          }))
        );
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };
    loadUsers();
  }, [realm, keycloak.token]);

  const handleDeleteGroup = async () => {
    if (!realm || !groupId) return;
    setIsDeleting(true);
    try {
      await deleteGroup(realm, groupId, keycloak.token || undefined);
      navigate({ to: "/usergroups" });
    } catch (err) {
      console.error("Failed to delete group", err);
      setStatus("Failed to delete group.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!realm || !groupId) return;
    setIsLoading(true);
    setStatus(null);
    try {
      await removeUserFromGroup(realm, groupId, memberId, keycloak.token || undefined);
      const membersRes = await fetchGroupMembers(realm, groupId, keycloak.token || undefined);
      setMembers(membersRes.members || []);
    } catch (err) {
      console.error("Failed to remove member", err);
      setStatus("Failed to remove member.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchUser.toLowerCase();
    return (
      !q ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full w-full flex flex-col bg-surface-subtle">
      {/* Header */}
      <div className="bg-background border-b border-border px-3 sm:px-4 lg:px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <Link
              to="/usergroups"
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  {groupName}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-rose-500 border border-rose-500/30 rounded-md hover:bg-rose-500/10 transition-colors text-sm font-medium cursor-pointer"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium cursor-pointer"
              onClick={() => navigate({ to: "/campaigns/new", search: { groupId } })}
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {status && (
            <div className="text-sm text-muted-foreground bg-surface border border-border rounded-md px-4 py-2">
              {status}
            </div>
          )}

          <GroupMembersTable
            members={members}
            isLoading={isLoading}
            onRemove={handleRemoveMember}
            onAddClick={() => setShowAddModal(true)}
          />
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Add member</h3>
              <button
                onClick={() => { setShowAddModal(false); setSearchUser(""); }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <input
                  className="w-full rounded-md border border-border/60 bg-surface-subtle pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground/60"
                  placeholder="Search by name or email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />
              </div>
              <div className="max-h-64 overflow-y-auto border border-border rounded-md divide-y divide-border/60">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    className="w-full px-4 py-3 text-left hover:bg-surface-subtle flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
                    disabled={isLoading}
                    onClick={async () => {
                      if (!realm || !groupId || !u.id) return;
                      setIsLoading(true);
                      setStatus(null);
                      try {
                        await addUserToGroup(realm, groupId, u.id, keycloak.token || undefined);
                        const membersRes = await fetchGroupMembers(realm, groupId, keycloak.token || undefined);
                        setMembers(membersRes.members || []);
                        setShowAddModal(false);
                        setSearchUser("");
                      } catch (err) {
                        console.error("Failed to add member", err);
                        setStatus("Failed to add member.");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    <div className="truncate">
                      <div className="font-medium text-[14px] text-foreground">
                        {u.username || "Unknown"}
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        {u.email || "—"}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          groupName={groupName}
          isLoading={isDeleting}
          onConfirm={handleDeleteGroup}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}


