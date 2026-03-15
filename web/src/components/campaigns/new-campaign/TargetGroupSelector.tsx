import { useCallback, useMemo } from "react";
import { Users } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";

import { useCampaign } from "./CampaignContext";
import GroupSuggestionItem, {
  type CampaignTargetGroup,
} from "./group-picker/GroupSuggestionItem";
import SelectedGroupCard from "./group-picker/SelectedGroupCard";
import SelectedGroupsEmptyState from "./group-picker/SelectedGroupsEmptyState";
import SearchableMultiPicker from "@/components/shared/multi-picker/SearchableMultiPicker";
import useAsyncMultiPickerItems from "@/components/shared/multi-picker/useAsyncMultiPickerItems";
import { fetchGroups } from "@/services/userGroupsApi";

export default function TargetGroupSelector() {
  const { data, updateData } = useCampaign();
  const { keycloak } = useKeycloak();

  const realm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  const loadGroups = useCallback(async (): Promise<CampaignTargetGroup[]> => {
    if (!realm) return [];

    const response = await fetchGroups(realm, keycloak.token || undefined);
    return (response.groups || [])
      .filter((group) => !!group.id && !!group.name)
      .map((group) => ({
        id: group.id!,
        name: group.name!,
        path: group.path,
      }));
  }, [realm, keycloak.token]);

  const { items: groups, loading, error } =
    useAsyncMultiPickerItems<CampaignTargetGroup>({
      loader: loadGroups,
      deps: [loadGroups],
      fallbackErrorMessage: "Failed to load groups",
    });

  return (
    <SearchableMultiPicker
      items={groups}
      selectedIds={data.user_group_ids}
      onSelectedIdsChange={(ids) => updateData({ user_group_ids: ids })}
      getSearchText={(group) => `${group.name} ${group.path || ""}`}
      renderSuggestionItem={(
        group,
        highlighted,
        onSelect,
        bindRef,
        onHighlight,
      ) => (
        <GroupSuggestionItem
          key={group.id}
          group={group}
          highlighted={highlighted}
          onSelect={onSelect}
          buttonRef={bindRef}
          onHighlight={onHighlight}
        />
      )}
      renderSelectedItem={(group, onRemove) => (
        <SelectedGroupCard key={group.id} group={group} onRemove={onRemove} />
      )}
      renderEmptySelected={<SelectedGroupsEmptyState />}
      label="Target Groups *"
      labelIcon={<Users size={12} />}
      
      selectedTitle="Selected Groups"
      searchPlaceholder="Search groups..."
      loading={loading}
      loadingText="Loading groups..."
      error={error}
      noResultsText="No groups match your search"
      maxSuggestions={5}
    />
  );
}
