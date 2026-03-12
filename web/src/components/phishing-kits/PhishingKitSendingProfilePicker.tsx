import SendingProfileMultiPicker from "@/components/shared/SendingProfileMultiPicker";
import { usePhishingKit } from "./PhishingKitContext";

export default function PhishingKitSendingProfilePicker() {
  const { data, updateData } = usePhishingKit();

  return (
    <SendingProfileMultiPicker
      selectedProfileIds={data.sending_profile_ids}
      onSelectedProfileIdsChange={(ids) =>
        updateData({ sending_profile_ids: ids })
      }
      tooltipLines={[
        "Select one or more SMTP profiles for this phishing kit.",
        "Emails will be sent through the selected profiles.",
      ]}
    />
  );
}
