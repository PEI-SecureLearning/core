import SendingProfileMultiPicker from "@/components/shared/SendingProfileMultiPicker";
import { useCampaign } from "./CampaignContext";

export default function SendingProfilePicker() {
  const { data, updateData } = useCampaign();

  return (
    <SendingProfileMultiPicker
      selectedProfileIds={data.sending_profile_ids}
      onSelectedProfileIdsChange={(ids) =>
        updateData({ sending_profile_ids: ids })
      }
      tooltipLines={[
        "Used as a fallback if the phishing kit's profile fails.",
        "Recommended for guaranteed email delivery.",
      ]}
    />
  );
}
