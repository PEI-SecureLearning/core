import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import UserGroupsHeader from "@/components/usergroups/userGroupsHeader";
import UserGroupsGrid from "@/components/usergroups/userGroupsGrid";
import UserGroupsTable from "@/components/usergroups/userGroupsTable";
import ConfirmDeleteModal from "@/components/usergroups/ConfirmDeleteModal";
import { userGroupsApi } from "@/services/userGroupsApi";
import { Loader2 } from "lucide-react";

export default function UserGroupsPage() {
  const { keycloak } = useKeycloak();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [groups, setGroups] = useState<
    { id?: string; name?: string; memberCount?: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tokenRealm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  const realm = tokenRealm || "";

  const loadData = async (targetRealm: string) => {
    setIsLoading(true);
    try {
      const groupsRes = await userGroupsApi.getGroups(targetRealm);
      // Optionally fetch member counts to keep cards/table closer to previous UX
      const groupsWithCounts = await Promise.all(
        (groupsRes.groups || []).map(async (g) => {
          let memberCount = 0;
          try {
            const membersRes = await userGroupsApi.getGroupMembers(targetRealm, g.id || "");
            memberCount = (membersRes.members || []).length;
          } catch {
            memberCount = 0;
          }
          return { ...g, memberCount };
        })
      );
      setGroups(groupsWithCounts);
    } catch (err) {
      console.error("Failed to load groups", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (realm) {
      loadData(realm);
    }
  }, [realm]);

  const pendingGroupName =
    groups.find((g) => g.id === pendingDeleteId)?.name ?? "this group";

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId || !realm) return;
    setIsDeleting(true);
    try {
      await userGroupsApi.deleteGroup(realm, pendingDeleteId);
      setPendingDeleteId(null);
      loadData(realm);
    } catch (err) {
      console.error("Failed to delete group", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full w-full animate-[fadeIn_0.4s_ease-out]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDelay {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <UserGroupsHeader view={view} setView={setView} />
      <div
        className="h-11/12 w-full overflow-y-auto p-4 space-y-4"
        style={{ animation: "fadeInDelay 0.5s ease-out 0.1s both" }}
      >
        {view === "grid" ? (
          <UserGroupsGrid
            groups={groups}
            isLoading={isLoading && !groups.length}
            onDelete={(id) => setPendingDeleteId(id)}
          />
        ) : (
          <UserGroupsTable
            groups={groups}
            onDelete={(id) => setPendingDeleteId(id)}
          />
        )}

        {!realm && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Resolving realm from token...
          </div>
        )}
      </div>

      {pendingDeleteId && (
        <ConfirmDeleteModal
          groupName={pendingGroupName}
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  );
}
