import { apiClient } from "@/lib/api-client"

export interface CurrentUserProfile {
  id: string
  realm: string
  username?: string | null
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  email_verified?: boolean | null
}

export const currentUserApi = {
  getCurrentUser: () => apiClient.get<CurrentUserProfile>("/users/me"),
}
