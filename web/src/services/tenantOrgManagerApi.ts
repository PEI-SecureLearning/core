import { apiClient } from "@/lib/api-client";
import type {
  CreateTenantUserPayload,
  CreateTenantUserResponse,
  TenantUserListResponse,
} from "@/types/tenantOrgManager";

export const tenantOrgManagerApi = {
  getUsers: (realm: string) =>
    apiClient.get<TenantUserListResponse>(`/realms/${encodeURIComponent(realm)}/users`),

  createUser: (realm: string, payload: CreateTenantUserPayload) =>
    apiClient.post<CreateTenantUserResponse>(
      `/realms/${encodeURIComponent(realm)}/users`,
      payload
    ),

  deleteUser: (realm: string, userId: string) =>
    apiClient.delete(
      `/org-manager/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}`
    ) as Promise<void>,
};
