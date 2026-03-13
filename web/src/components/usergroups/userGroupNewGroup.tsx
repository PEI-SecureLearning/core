import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import BasicInfo from "./newGroupBasicInfo";
import NewGroupFooter from "./newGroupFooter";
import Preview from "./newGroupPreview";
import MembersSection from "./newGroupMembers";
import {
  addUserToGroup,
  createGroup,
  createUser,
  fetchGroups,
  fetchUsers,
} from "../../services/userGroupsApi";

interface Member {
  id: string;
  name: string;
  email: string;
  department: string;
}

function getCreateGroupErrorMessage(error: unknown, groupName: string): string {
  const raw = (error instanceof Error ? error.message : String(error || "")).toLowerCase();

  if (raw.includes("already exists") || raw.includes("409")) {
    return `A group named "${groupName}" already exists. Try a different name.`;
  }
  if (raw.includes("realm mismatch") || raw.includes("403")) {
    return "You don't have permission to create groups in this tenant.";
  }
  if (raw.includes("invalid access token") || raw.includes("401")) {
    return "Your session expired. Please sign in again and retry.";
  }
  if (raw.includes("failed to fetch") || raw.includes("network")) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (raw.includes("validation") || raw.includes("422")) {
    return "Some group details are invalid. Please review and try again.";
  }

  return `Couldn't create "${groupName}". Please try again.`;
}

export default function NewUserGroup() {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
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
            id: u.id || "",
            name:
              `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
              u.username ||
              "",
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
      setStatus("Couldn't detect your tenant. Refresh the page and try again.");
      return;
    }
    if (!groupName) {
      setStatus("Give your group a name before creating it.");
      return;
    }
    setIsLoading(true);
    setStatus(null);
    try {
      // Create the group first
      await createGroup(realm, groupName, keycloak.token || undefined);
      let createdId: string | null = null;
      try {
        const groupsRes = await fetchGroups(realm, keycloak.token || undefined);
        const created = (groupsRes.groups || []).find((g) => g.name === groupName);
        createdId = created?.id || null;
      } catch (err) {
        console.warn("Group created but failed to refresh groups", err);
        // Keep going; we still consider the creation successful.
      }

      if (createdId) {
        let createdCount = 0;
        let addedCount = 0;

        for (const m of selectedMembers) {
          try {
            // Check if this is an existing user (has a valid UUID) or a CSV import (no valid UUID)
            const isExistingUser = m.id && m.id.includes("-") && m.id.length > 30;

            if (isExistingUser) {
              await addUserToGroup(realm, createdId, m.id, keycloak.token || undefined);
              addedCount++;
            } else {
              const username = m.email?.split("@")[0] || m.name.toLowerCase().replace(/\s+/g, ".");
              const result = await createUser(
                realm,
                username,
                m.name,
                m.email,
                "DEFAULT_USER",
                createdId,
                keycloak.token || undefined
              );
              if (result.status === "created") {
                createdCount++;
              }
            }
          } catch (err) {
            console.error("Failed to process member", m.name, err);
          }
        }

        toast.success(
          `Group created. ${addedCount} users added.`,
          { position: "top-right" }
        );
      } else {
        toast.success("Group created.", { position: "top-right" });
      }

      setGroupName("");
      setDescription("");
      setSelectedMembers([]);
      navigate({ to: "/usergroups" });
    } catch (err) {
      console.error(err);
      setStatus(getCreateGroupErrorMessage(err, groupName));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border py-3 px-6 bg-surface-subtle">
        <h3 className="text-xl font-semibold text-foreground tracking-tight">
          Create a new group
        </h3>
        <h2 className="text-sm font-medium text-muted-foreground">
          Set up a new group for your campaigns
        </h2>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-row gap-4 p-4 min-h-0 overflow-hidden">
        <div className="h-full w-[65%] overflow-y-auto pr-2 space-y-5">
          <div>
            <BasicInfo
              groupName={groupName}
              description={description}
              onGroupNameChange={setGroupName}
              onDescriptionChange={setDescription}
            />
          </div>
          <div>
            <MembersSection
              searchQuery={searchQuery}
              filteredUsers={filteredUsers}
              selectedMembers={selectedMembers}
              setSelectedMembers={setSelectedMembers}
              onSearchChange={setSearchQuery}
              onAddMember={addMember}
              onRemoveMember={removeMember}
              onStatus={setStatus}
            />
          </div>
        </div>

        <div className="h-full w-[35%] overflow-hidden">
          <Preview
            groupName={groupName}
            selectedMembersCount={selectedMembers.length}
            description={description}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-border py-4 bg-surface">
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
