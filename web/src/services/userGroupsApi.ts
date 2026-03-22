const API_BASE = import.meta.env.VITE_API_URL;

type GroupDto = { id?: string; name?: string; path?: string };
type GroupListApiResponse = GroupDto[] | { realm?: string; groups?: GroupDto[] };

type MemberDto = {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};
type GroupMembersApiResponse =
  | MemberDto[]
  | { realm?: string; groupId?: string; members?: MemberDto[] };

function normalizeGroupsResponse(
  payload: GroupListApiResponse,
  realm: string
): { realm: string; groups: GroupDto[] } {
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
): { realm: string; groupId: string; members: MemberDto[] } {
  if (Array.isArray(payload)) {
    return { realm, groupId, members: payload };
  }

  return {
    realm: payload.realm || realm,
    groupId: payload.groupId || groupId,
    members: payload.members || [],
  };
}

export async function fetchGroups(realm: string, token?: string) {
  const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/groups`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const payload = (await res.json()) as GroupListApiResponse;
  return normalizeGroupsResponse(payload, realm);
}

export async function createGroup(realm: string, name: string, token?: string) {
  const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/groups`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function fetchUsers(realm: string, token?: string) {
  const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/users`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    realm: string;
    users: { id?: string; username?: string; email?: string; firstName?: string; lastName?: string }[];
  }>;
}

export async function createUser(
  realm: string,
  username: string,
  name: string,
  email: string,
  role: string,
  groupId: string | null,
  token?: string
) {
  const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/users`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      name,
      email,
      role,
      group_id: groupId,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    realm: string;
    username: string;
    status: string;
    temporary_password: string;
  }>;
}


export async function addUserToGroup(realm: string, groupId: string, userId: string, token?: string) {
  const res = await fetch(
    `${API_BASE}/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(
      userId
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function fetchGroupMembers(realm: string, groupId: string, token?: string) {
  const res = await fetch(
    `${API_BASE}/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(groupId)}/members`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const payload = (await res.json()) as GroupMembersApiResponse;
  return normalizeGroupMembersResponse(payload, realm, groupId);
}

export async function deleteGroup(realm: string, groupId: string, token?: string) {
  const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(groupId)}`, {
    method: "DELETE",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function updateGroup(realm: string, groupId: string, name: string, token?: string) {
  const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(groupId)}`, {
    method: "PUT",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function removeUserFromGroup(realm: string, groupId: string, userId: string, token?: string) {
  const res = await fetch(
    `${API_BASE}/realms/${encodeURIComponent(realm)}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(
      userId
    )}`,
    {
      method: "DELETE",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return true;
}
