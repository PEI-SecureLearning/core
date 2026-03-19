import { useNavigate } from "@tanstack/react-router";

import SendingProfileFormContainer from "@/components/sending-profiles/shared/SendingProfileFormContainer";
import { useSendingProfileForm } from "@/components/sending-profiles/shared/useSendingProfileForm";
import { createSendingProfile } from "@/services/sendingProfilesApi";

export default function NewSendingProfile() {
  const navigate = useNavigate();
  const form = useSendingProfileForm();

  const handleSubmit = async () => {
    if (!form.realm) {
      form.setStatus("Error: Could not determine Realm. Are you logged in?");
      return false;
    }

    form.setIsLoading(true);
    form.setStatus(null);

    try {
      await createSendingProfile(
        form.realm,
        form.buildPayload(),
        form.keycloak.token
      );
      form.setStatus("Profile created successfully!");
      setTimeout(() => navigate({ to: "/sending-profiles" }), 1000);
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create profile. Check connection.";
      form.setStatus(message);
      return false;
    } finally {
      form.setIsLoading(false);
    }
  };

  return (
    <SendingProfileFormContainer
      form={form}
      mode="create"
      onSubmit={handleSubmit}
    />
  );
}
