import { apiClient } from "@/lib/api-client";
import type {
  CreateUserGroupMemberPayload,
  CreateUserGroupMemberResponse,
  CreateUserGroupPayload,
  CreateUserGroupResponse,
  UpdateUserGroupPayload,
  UserGroupDto,
  UserGroupListResponse,
  UserGroupMemberDto,
  UserGroupMembersResponse,
  UserGroupUsersResponse,
} from "@/types/userGroups";

type GroupListApiResponse = UserGroupDto[] | { realm?: string; groups?: UserGroupDto[] };
type GroupMembersApiResponse =
  | UserGroupMemberDto[]
  | { realm?: string; groupId?: string; members?: UserGroupMemberDto[] };

function normalizeGroupsResponse(
  payload: GroupListApiResponse,
  realm: string
): UserGroupListResponse {
  if (Array.isArray(payload)) {
    return { realm, groups: payload };
  }

  return {
    realm: payload.realm || realm,
    groups: payload.groups || [],
  };
}

function normalizeGroupMembersResponse(
  payload: GroupMembersApiResponse,
  realm: string,
  groupId: string
): UserGroupMembersResponse {
  if (Array.isArray(payload)) {
    return { realm, groupId, members: payload };
  }

  return {
    realm: payload.realm || realm,
    groupId: payload.groupId || groupId,
    members: payload.members || [],
  };
}

export const userGroupsApi = {
  async getGroups(realm: string): Promise<UserGroupListResponse> {
    const payload = await apiClient.get<GroupListApiResponse>(
      `/realms/${encodeURIComponent(realm)}/groups`
    );
    return normalizeGroupsResponse(payload, realm);
  },

  createGroup: (realm: string, payload: CreateUserGroupPayload) =>
    apiClient.post<CreateUserGroupResponse>(
      `/realms/${encodeURIComponent(realm)}/groups`,
      payload
    ),

  getUsers: (realm: string) =>
    apiClient.get<UserGroupUsersResponse>(`/realms/${encodeURIComponent(realm)}/users`),

  createUser: (realm: string, payload: CreateUserGroupMemberPayload) =>
    apiClient.post<CreateUserGroupMemberResponse>(
      `/realms/${encodeURIComponent(realm)}/users`,
      payload
    ),

  addUserToGroup: (realm: string, groupId: string, userId: string) =>
    apiClient.post<void>(
      `/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
      {}
    ),

  async getGroupMembers(realm: string, groupId: string): Promise<UserGroupMembersResponse> {
    const payload = await apiClient.get<GroupMembersApiResponse>(
      `/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(groupId)}/members`
    );
    return normalizeGroupMembersResponse(payload, realm, groupId);
  },

  deleteGroup: (realm: string, groupId: string) =>
    apiClient.delete(`/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(groupId)}`) as Promise<void>,

  updateGroup: (realm: string, groupId: string, payload: UpdateUserGroupPayload) =>
    apiClient.put<void>(
      `/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(groupId)}`,
      payload
    ),

  removeUserFromGroup: (realm: string, groupId: string, userId: string) =>
    apiClient.delete(
      `/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`
    ) as Promise<void>,
};
