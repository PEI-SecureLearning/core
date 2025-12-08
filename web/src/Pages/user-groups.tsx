import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import UserGroupsHeader from "@/components/usergroups/userGroupsHeader";
import UserGroupsGrid from "@/components/usergroups/userGroupsGrid";
import UserGroupsTable from "@/components/usergroups/userGroupsTable";
import { fetchGroups, fetchGroupMembers, deleteGroup } from "@/components/usergroups/api";
import { Loader2 } from "lucide-react";

export default function UserGroupsPage() {
  const { keycloak } = useKeycloak();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [groups, setGroups] = useState<{ id?: string; name?: string; memberCount?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      const groupsRes = await fetchGroups(targetRealm, keycloak.token || undefined);
      // Optionally fetch member counts to keep cards/table closer to previous UX
      const groupsWithCounts = await Promise.all(
        (groupsRes.groups || []).map(async (g) => {
          let memberCount = 0;
          try {
            const membersRes = await fetchGroupMembers(targetRealm, g.id || "", keycloak.token || undefined);
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

  return (
    <div className="h-full w-full">
      <div className="h-1/12 w-full border-b flex items-center px-4 font-semibold text-lg">
        <UserGroupsHeader view={view} setView={setView} />
      </div>
      <div className="h-11/12 w-full overflow-y-auto p-4 space-y-4">
        {view === "grid" ? (
          <UserGroupsGrid
            groups={groups}
            isLoading={isLoading && !groups.length}
            onDelete={async (id) => {
              const realm = tokenRealm || "";
              if (!realm) return;
              const confirmed = window.confirm("Delete this group?");
              if (!confirmed) return;
              try {
                await deleteGroup(realm, id, keycloak.token || undefined);
                loadData(realm);
              } catch (err) {
                console.error("Failed to delete group", err);
              }
            }}
          />
        ) : (
          <UserGroupsTable
            groups={groups}
            onDelete={async (id) => {
              const realm = tokenRealm || "";
              if (!realm) return;
              const confirmed = window.confirm("Delete this group?");
              if (!confirmed) return;
              try {
                await deleteGroup(realm, id, keycloak.token || undefined);
                loadData(realm);
              } catch (err) {
                console.error("Failed to delete group", err);
              }
            }}
          />
        )}

        {!realm && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Resolving realm from token...
          </div>
        )}
      </div>
    </div>
  );
}
