const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export async function fetchGroups(realm: string, token?: string) {
  const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realm)}/groups`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ realm: string; groups: { id?: string; name?: string; path?: string }[] }>;
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
  return res.json();
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
  const res = await fetch(`${API_BASE}/realms/users`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      realm,
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
  return res.json() as Promise<{
    realm: string;
    groupId: string;
    members: { id?: string; username?: string; email?: string; firstName?: string; lastName?: string }[];
  }>;
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
