export interface TenantUserDto {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  is_org_manager?: boolean;
}

export interface TenantUserDetailDto extends TenantUserDto {
  email_verified?: boolean;
  active?: boolean;
  role?: string;
  realm?: string;
  groups?: TenantUserGroupDto[];
}

export interface TenantUserGroupDto {
  id?: string;
  name?: string;
}

export interface TenantUserListResponse {
  realm: string;
  total?: number;
  users: TenantUserDto[];
}

export interface TenantGroupDto {
  id?: string;
  name?: string;
  path?: string | null;
}

export interface TenantGroupListResponse {
  realm: string;
  groups: TenantGroupDto[];
}

export interface CreateTenantUserPayload {
  username: string;
  name: string;
  email: string;
  role: string;
  group_id?: string;
}

export interface CreateTenantUserResponse {
  realm: string;
  username: string;
  status: string;
  temporary_password: string;
}

export interface UserCertificateDto {
  user_id: string;
  course_id: string;
  last_emission_date: string;
  expiration_date: string;
  expired: boolean;
  course_name?: string | null;
  course_cover_image_link?: string | null;
  difficulty?: string | null;
  category?: string | null;
  realm: string;
}
