import { useCallback } from "react";
import { Send } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";

import type { FormTooltipSide } from "@/components/shared/FormTooltip";
import SearchableMultiPicker from "@/components/shared/multi-picker/SearchableMultiPicker";
import useAsyncMultiPickerItems from "@/components/shared/multi-picker/useAsyncMultiPickerItems";
import SelectedSendingProfileCard from "@/components/shared/sending-profile-picker/SelectedSendingProfileCard";
import SelectedSendingProfilesEmptyState from "@/components/shared/sending-profile-picker/SelectedSendingProfilesEmptyState";
import SendingProfileSuggestionItem from "@/components/shared/sending-profile-picker/SendingProfileSuggestionItem";
import { fetchSendingProfiles } from "@/services/sendingProfilesApi";
import type { SendingProfileDisplayInfo } from "@/types/sendingProfile";

interface SendingProfileMultiPickerProps {
  readonly selectedProfileIds: number[];
  readonly onSelectedProfileIdsChange: (ids: number[]) => void;
  readonly tooltipLines: readonly string[];
  readonly tooltipSide?: FormTooltipSide;
  readonly maxSuggestions?: number;
}

export default function SendingProfileMultiPicker({
  selectedProfileIds,
  onSelectedProfileIdsChange,
  tooltipLines,
  tooltipSide = "right",
  maxSuggestions = 5
}: Readonly<SendingProfileMultiPickerProps>) {
  const { keycloak } = useKeycloak();

  const loadSendingProfiles = useCallback(
    () => fetchSendingProfiles("", keycloak.token || undefined),
    [keycloak.token]
  );

  const {
    items: profiles,
    loading,
    error
  } = useAsyncMultiPickerItems<SendingProfileDisplayInfo>({
    loader: loadSendingProfiles,
    deps: [loadSendingProfiles],
    fallbackErrorMessage: "Unable to load sending profiles"
  });

  return (
    <SearchableMultiPicker
      items={profiles}
      selectedIds={selectedProfileIds}
      onSelectedIdsChange={onSelectedProfileIdsChange}
      getSearchText={(profile) => `${profile.name} ${profile.from_email}`}
      renderSuggestionItem={(
        profile,
        highlighted,
        onSelect,
        bindRef,
        onHighlight
      ) => (
        <SendingProfileSuggestionItem
          key={profile.id}
          profile={profile}
          highlighted={highlighted}
          onSelect={onSelect}
          buttonRef={bindRef}
          onHighlight={onHighlight}
        />
      )}
      renderSelectedItem={(profile, onRemove) => (
        <SelectedSendingProfileCard
          key={profile.id}
          profile={profile}
          onRemove={onRemove}
        />
      )}
      renderEmptySelected={<SelectedSendingProfilesEmptyState />}
      label="Sending Profiles"
      labelIcon={<Send size={12} />}
      tooltipLines={tooltipLines}
      tooltipSide={tooltipSide}
      selectedTitle="Selected Profiles"
      searchPlaceholder="Search profiles by name or email..."
      loading={loading}
      loadingText="Loading sending profiles..."
      error={error}
      noResultsText="No sending profile found"
      maxSuggestions={maxSuggestions}
    />
  );
}
