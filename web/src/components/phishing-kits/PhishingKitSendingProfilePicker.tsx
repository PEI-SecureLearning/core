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
            "Emails will be sent through the selected profiles.",
      ]}
    />
  );
}
