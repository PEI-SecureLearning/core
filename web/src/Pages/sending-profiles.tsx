import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Loader2 } from "lucide-react";

import SendingProfilesHeader from "@/components/sending-profiles/SendingProfilesHeader";
import SendingProfilesGrid from "@/components/sending-profiles/SendingProfilesGrid";
import SendingProfilesTable from "@/components/sending-profiles/SendingProfilesTable";
import ConfirmDeleteModal from "@/components/usergroups/ConfirmDeleteModal";

import {
  fetchSendingProfiles,
  deleteSendingProfile,
} from "@/services/sendingProfilesApi";
import { type SendingProfileDisplayInfo } from "@/types/sendingProfile";

export default function SendingProfilesPage() {
  const { keycloak } = useKeycloak();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [profiles, setProfiles] = useState<SendingProfileDisplayInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tokenRealm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  const realm = tokenRealm || "";

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSendingProfiles(realm, keycloak.token || undefined);
      setProfiles(data);
    } catch (err) {
      console.error("Failed to load profiles", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (realm) {
      loadData();
    }
  }, [realm]);

  const pendingProfileName =
    profiles.find((p) => p.id === pendingDeleteId)?.name ?? "this profile";

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null || !realm) return;
    setIsDeleting(true);
    try {
      await deleteSendingProfile(realm, pendingDeleteId, keycloak.token || undefined);
      setPendingDeleteId(null);
      loadData();
    } catch (err) {
      console.error("Failed to delete profile", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <SendingProfilesHeader view={view} setView={setView} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {view === "grid" ? (
          <SendingProfilesGrid
            profiles={profiles}
            isLoading={isLoading && !profiles.length}
            onDelete={(id) => setPendingDeleteId(id)}
          />
        ) : (
          <SendingProfilesTable
            profiles={profiles}
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

      {pendingDeleteId !== null && (
        <ConfirmDeleteModal
          groupName={pendingProfileName}
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  );
}
