export interface UserGroupDto {
  id?: string;
  name?: string;
  path?: string;
}

export interface UserGroupListResponse {
  realm: string;
  groups: UserGroupDto[];
}

export interface UserGroupMemberDto {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface UserGroupMembersResponse {
  realm: string;
  groupId: string;
  members: UserGroupMemberDto[];
}

export interface UserGroupUserDto {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface UserGroupUsersResponse {
  realm: string;
  users: UserGroupUserDto[];
}

export interface CreateUserGroupPayload {
  name: string;
}

export interface CreateUserGroupResponse {
  id?: string;
  name?: string;
  path?: string;
}

export interface UpdateUserGroupPayload {
  name: string;
}

export interface CreateUserGroupMemberPayload {
  username: string;
  name: string;
  email: string;
  role: string;
  group_id?: string | null;
}

export interface CreateUserGroupMemberResponse {
  realm: string;
  username: string;
  status: string;
  temporary_password: string;
}
