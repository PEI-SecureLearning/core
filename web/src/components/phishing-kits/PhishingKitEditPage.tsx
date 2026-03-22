import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Loader2 } from "lucide-react";
import { fetchPhishingKit } from "@/services/phishingKitsApi";
import { fetchSendingProfiles } from "@/services/sendingProfilesApi";
import { templateApi } from "@/services/templateApi";
import PhishingKitForm from "./PhishingKitForm";

interface PhishingKitEditPageProps {
  readonly kitId: number;
}

export default function PhishingKitEditPage({
  kitId
}: PhishingKitEditPageProps) {
  const { keycloak } = useKeycloak();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["phishing-kit", kitId],
    queryFn: () => fetchPhishingKit(kitId)
  });

  const {
    data: templates,
    isLoading: templatesLoading,
    isError: templatesError
  } = useQuery({
    queryKey: ["templates"],
    queryFn: () => templateApi.getTemplates()
  });

  const {
    data: sendingProfiles,
    isLoading: sendingProfilesLoading,
    isError: sendingProfilesError
  } = useQuery({
    queryKey: ["sending-profiles"],
    queryFn: () => fetchSendingProfiles("", keycloak.token || undefined)
  });

  const resolvedInitialData = useMemo(() => {
    if (!data) return null;

    const matchTemplate = (
      path: "/templates/emails/" | "/templates/pages/",
      name?: string,
      createdAt?: string,
      updatedAt?: string
    ) => {
      if (!templates?.length || !name) return null;

      const sameName = templates.filter(
        (t) => t.path === path && t.name === name
      );

      if (!sameName.length) return null;

      const byUpdatedAt = updatedAt
        ? sameName.find((t) => t.updated_at === updatedAt)
        : null;
      if (byUpdatedAt) return byUpdatedAt;

      const byCreatedAt = createdAt
        ? sameName.find((t) => t.created_at === createdAt)
        : null;
      if (byCreatedAt) return byCreatedAt;

      return sameName[0];
    };

    const emailTemplate = matchTemplate(
      "/templates/emails/",
      data.email_template_name,
      data.email_template_created_at,
      data.email_template_updated_at
    );

    const landingPageTemplate = matchTemplate(
      "/templates/pages/",
      data.landing_page_template_name,
      data.landing_page_template_created_at,
      data.landing_page_template_updated_at
    );

    const selectedSendingProfileIds =
      data.sending_profile_names
        ?.map(
          (name) =>
            sendingProfiles?.find((profile) => profile.name === name)?.id
        )
        .filter((id): id is number => typeof id === "number") ?? [];

    return {
      name: data.name,
      description: data.description || "",
      args: data.args || {},
      email_template_id: emailTemplate?.id ?? null,
      email_template_name: data.email_template_name || null,
      landing_page_template_id: landingPageTemplate?.id ?? null,
      landing_page_template_name: data.landing_page_template_name || null,
      sending_profile_ids: selectedSendingProfileIds
    };
  }, [data, sendingProfiles, templates]);

  if (isLoading || templatesLoading || sendingProfilesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="animate-spin" size={20} />
        Loading phishing kit...
      </div>
    );
  }

  if (
    isError ||
    templatesError ||
    sendingProfilesError ||
    !data ||
    !resolvedInitialData
  ) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive">
        Failed to load phishing kit. Please try again.
      </div>
    );
  }

  return <PhishingKitForm editId={kitId} initialData={resolvedInitialData} />;
}
