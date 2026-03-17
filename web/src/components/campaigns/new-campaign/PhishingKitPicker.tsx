import { useCallback } from "react";
import { Package } from "lucide-react";

import { useCampaign } from "./CampaignContext";
import PhishingKitSuggestionItem from "./phishing-kit-picker/PhishingKitSuggestionItem";
import SelectedPhishingKitCard from "./phishing-kit-picker/SelectedPhishingKitCard";
import SelectedPhishingKitsEmptyState from "./phishing-kit-picker/SelectedPhishingKitsEmptyState";
import SearchableMultiPicker from "@/components/shared/multi-picker/SearchableMultiPicker";
import useAsyncMultiPickerItems from "@/components/shared/multi-picker/useAsyncMultiPickerItems";
import { fetchPhishingKits } from "@/services/phishingKitsApi";
import type { PhishingKitDisplayInfo } from "@/types/phishingKit";

export default function PhishingKitPicker() {
  const { data, updateData } = useCampaign();

  const loadPhishingKits = useCallback(() => fetchPhishingKits(), []);

  const { items: kits, loading, error } =
    useAsyncMultiPickerItems<PhishingKitDisplayInfo>({
      loader: loadPhishingKits,
      deps: [loadPhishingKits],
      fallbackErrorMessage: "Unable to load phishing kits",
    });

  return (
    <SearchableMultiPicker
      items={kits}
      selectedIds={data.phishing_kit_ids}
      onSelectedIdsChange={(ids) => updateData({ phishing_kit_ids: ids })}
      getSearchText={(kit) => `${kit.name} ${kit.description || ""}`}
      renderSuggestionItem={(kit, highlighted, onSelect, bindRef, onHighlight) => (
        <PhishingKitSuggestionItem
          key={kit.id}
          kit={kit}
          highlighted={highlighted}
          onSelect={onSelect}
          buttonRef={bindRef}
          onHighlight={onHighlight}
        />
      )}
      renderSelectedItem={(kit, onRemove) => (
        <SelectedPhishingKitCard key={kit.id} kit={kit} onRemove={onRemove} />
      )}
      renderEmptySelected={<SelectedPhishingKitsEmptyState />}
      label="Phishing Kits *"
      labelIcon={<Package size={12} />}
      tooltipLines={[
        "A random kit will be chosen for each target user.",
      ]}
      selectedTitle="Selected Kits"
      searchPlaceholder="Search phishing kits by name..."
      loading={loading}
      loadingText="Loading phishing kits..."
      error={error}
      noResultsText="No phishing kit found"
      maxSuggestions={5}
    />
  );
}
