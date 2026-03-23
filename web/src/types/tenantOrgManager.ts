export interface TenantUserDto {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  is_org_manager?: boolean;
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
