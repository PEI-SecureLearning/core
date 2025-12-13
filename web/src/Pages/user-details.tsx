import {
  ArrowLeft,
  Users,
  Calendar,
  Trash2,
  UserPlus,
  Send,
  X,
} from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import {
  fetchGroups,
  fetchGroupMembers,
  addUserToGroup,
  fetchUsers,
  removeUserFromGroup,
} from "@/services/userGroupsApi";

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

  const [groupName, setGroupName] = useState<string>("Group");
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [users, setUsers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchUser, setSearchUser] = useState("");

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
        console.log("Raw API response:", JSON.stringify(res, null, 2));
        console.log("First user id:", res.users?.[0]?.id);
        const mapped =
          (res.users || []).map((u) => ({
            id: u.id || "",
            username: u.username,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
          })) || [];
        setUsers(mapped);
        console.log(mapped);
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };
    loadUsers();
  }, [realm, keycloak.token]);

  const colorClasses = {
    purple: "from-purple-400 to-purple-600",
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/usergroups"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-full bg-gradient-to-br ${colorClasses.purple} flex items-center justify-center shadow-md`}
              >
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {groupName}
                </h1>
                <p className="text-sm text-gray-500">
                  {members.length} members
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Group Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                About this group
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Group ID: {groupId}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {realm || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-900">N/A</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Campaigns
              </h2>
              <div className="text-sm text-gray-500">No campaign data.</div>
            </div>
          </div>

          {/* Members Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Members</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {members.length} total members
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-60"
                  onClick={() => setShowAddModal(true)}
                  disabled={isLoading}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add</span>
                </button>
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr
                      key={member.id}
                      className={`hover:bg-gray-50 transition-colors ${index !== members.length - 1
                        ? "border-b border-gray-100"
                        : ""
                        }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {(member.firstName || member.username || "U").slice(
                              0,
                              1
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {member.username || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {member.email || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {(member.firstName || "") +
                            " " +
                            (member.lastName || "")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                          disabled={isLoading}
                          onClick={async () => {
                            if (!realm || !groupId || !member.id) return;
                            setIsLoading(true);
                            setStatus(null);
                            try {
                              await removeUserFromGroup(
                                realm,
                                groupId,
                                member.id,
                                keycloak.token || undefined
                              );
                              const membersRes = await fetchGroupMembers(
                                realm,
                                groupId,
                                keycloak.token || undefined
                              );
                              setMembers(membersRes.members || []);
                            } catch (err) {
                              console.error("Failed to remove member", err);
                              setStatus("Failed to remove member.");
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {status && <div className="text-sm text-gray-600 px-4">{status}</div>}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Add member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Search user..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
              <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
                {users
                  .filter((u) => {
                    const q = searchUser.toLowerCase();
                    return (
                      !q ||
                      (u.username || "").toLowerCase().includes(q) ||
                      (u.email || "").toLowerCase().includes(q)
                    );
                  })
                  .map((u) => (
                    <button
                      key={u.id}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                      disabled={isLoading}
                      onClick={async () => {
                        if (!realm || !groupId || !u.id) return;
                        setIsLoading(true);
                        setStatus(null);
                        try {
                          await addUserToGroup(
                            realm,
                            groupId,
                            u.id,
                            keycloak.token || undefined
                          );
                          const membersRes = await fetchGroupMembers(
                            realm,
                            groupId,
                            keycloak.token || undefined
                          );
                          setMembers(membersRes.members || []);
                          setShowAddModal(false);
                        } catch (err) {
                          console.error("Failed to add member", err);
                          setStatus("Failed to add member.");
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      <div className="truncate">
                        <div className="font-medium text-gray-900">
                          {u.username || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {u.email || "—"}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
