import { apiClient } from "@/lib/api-client";
import type { CampaignUserSending } from "@/services/campaignsApi";
import type {
  CreateTenantUserPayload,
  CreateTenantUserResponse,
  UserCertificateDto,
  TenantUserDetailDto,
  TenantUserListResponse,
} from "@/types/tenantOrgManager";

export const userApi = {
  getUsers: (realm: string) =>
    apiClient.get<TenantUserListResponse>(`/realms/${encodeURIComponent(realm)}/users`),

  getUser: (realm: string, userId: string) =>
    apiClient.get<TenantUserDetailDto>(
      `/org-manager/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}`
    ),

  getUserSendings: (realm: string, userId: string) =>
    apiClient.get<CampaignUserSending[]>(
      `/org-manager/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}/sendings`
    ),

  getUserCertificates: (userId: string, includeExpired = true) => {
    const params = new URLSearchParams();

    if (includeExpired) {
      params.set("include_expired", "true");
    }

    const query = params.toString();
    const path = `/users/${encodeURIComponent(userId)}/certificates`;

    return apiClient.get<UserCertificateDto[]>(query ? `${path}?${query}` : path);
  },

  createUser: (realm: string, payload: CreateTenantUserPayload) =>
    apiClient.post<CreateTenantUserResponse>(
      `/realms/${encodeURIComponent(realm)}/users`,
      payload
    ),

  deleteUser: (realm: string, userId: string) =>
    apiClient.delete(
      `/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}/org-manager`
    ),
};
