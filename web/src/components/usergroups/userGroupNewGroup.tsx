import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import BasicInfo from "./newGroupBasicInfo";
import NewGroupFooter from "./newGroupFooter";
import Preview from "./newGroupPreview";
import MembersSection from "./newGroupMembers";
import { addUserToGroup, createGroup, fetchGroups, fetchUsers } from "./api";

interface Member {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface Color {
  name: string;
  class: string;
  bg: string;
}

export default function NewUserGroup() {
  const { keycloak } = useKeycloak();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("purple");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Member[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const tokenRealm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  const colors: Color[] = [
    { name: "purple", class: "from-purple-400 to-purple-600", bg: "bg-purple-500" },
    { name: "blue", class: "from-blue-400 to-blue-600", bg: "bg-blue-500" },
    { name: "green", class: "from-green-400 to-green-600", bg: "bg-green-500" },
    { name: "pink", class: "from-pink-400 to-pink-600", bg: "bg-pink-500" },
    { name: "orange", class: "from-orange-400 to-orange-600", bg: "bg-orange-500" },
    { name: "teal", class: "from-teal-400 to-teal-600", bg: "bg-teal-500" },
  ];

  const filteredUsers = availableUsers.filter(
    (user) =>
      !selectedMembers.find((m) => m.id === user.id) &&
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const loadUsers = async () => {
      const realm = tokenRealm || "";
      if (!realm) return;
      try {
        const res = await fetchUsers(realm, keycloak.token || undefined);
        const mapped =
          (res.users || []).map((u) => ({
            id: u.id || u.username || "",
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "",
            email: u.email || "",
            department: "Tenant",
          })) || [];
        setAvailableUsers(mapped);
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };
    loadUsers();
  }, [tokenRealm, keycloak.token]);

  const addMember = (user: Member) => {
    setSelectedMembers((prev) => [...prev, user]);
    setSearchQuery("");
  };

  const removeMember = (userId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleSubmit = async () => {
    const realm = tokenRealm || "";
    if (!realm) {
      setStatus("Realm not resolved.");
      return;
    }
    if (!groupName) {
      setStatus("Group name is required.");
      return;
    }
    setIsLoading(true);
    setStatus(null);
    try {
      await createGroup(realm, groupName, keycloak.token || undefined);
      const groupsRes = await fetchGroups(realm, keycloak.token || undefined);
      const created = (groupsRes.groups || []).find((g) => g.name === groupName);
      if (created?.id) {
        for (const m of selectedMembers) {
          if (!m.id) continue;
          try {
            await addUserToGroup(realm, created.id, m.id, keycloak.token || undefined);
          } catch (err) {
            console.error("Failed to add member", err);
          }
        }
      }
      setStatus("Group created.");
      setGroupName("");
      setDescription("");
      setSelectedMembers([]);
    } catch (err) {
      console.error(err);
      setStatus("Failed to create group.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedColorClass = colors.find((c) => c.name === selectedColor)?.class || colors[0].class;

  return (
    <div className="h-full w-full">
      <div className="h-1/12 border-b py-2 px-5">
        <h3 className="text-xl font-semibold text-gray-900">Create a new group</h3>
        <h2 className="text-l font-medium text-gray-700">Set up a new group for your campaigns</h2>
      </div>
      <div className="h-10/12 flex row">
        <div className="h-full w-5/6 items-center justify-center px-5 py-5 overflow-y-auto gap-4 space-y-6">
          <div className="h-2/3 w-full">
            <BasicInfo
              groupName={groupName}
              description={description}
              selectedColor={selectedColor}
              colors={colors}
              onGroupNameChange={setGroupName}
              onDescriptionChange={setDescription}
              onColorSelect={setSelectedColor}
            />
          </div>
          <div className="h-full w-full">
            <MembersSection
              searchQuery={searchQuery}
              filteredUsers={filteredUsers}
              selectedMembers={selectedMembers}
              setSelectedMembers={setSelectedMembers}
              selectedColorClass={selectedColorClass}
              onSearchChange={setSearchQuery}
              onAddMember={addMember}
              onRemoveMember={removeMember}
              onStatus={setStatus}
            />
          </div>
        </div>

        <div className="h-full w-2/6 py-5 px-5">
          <Preview
            groupName={groupName}
            selectedColor={selectedColor}
            selectedColorClass={selectedColorClass}
            selectedMembersCount={selectedMembers.length}
            description={description}
          />
        </div>
      </div>
      <div className="h-1/12 border-t py-4 bg-gray-50">
        <NewGroupFooter
          onSubmit={handleSubmit}
          groupName={groupName}
          selectedMembersCount={selectedMembers.length}
          isLoading={isLoading}
          status={status}
        />
      </div>
    </div>
  );
}
