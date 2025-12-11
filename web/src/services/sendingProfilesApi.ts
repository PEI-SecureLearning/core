// src/services/sendingProfilesApi.ts
import {
  type SendingProfile,
  type SendingProfileCreate,
} from "@/types/sendingProfile";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// 1. CREATE (POST)
export async function createSendingProfile(
  realm: string,
  data: SendingProfileCreate,
  token?: string
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/sending-profiles`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create profile");
  }
  return res.json();
}

// 2. READ ALL (GET)
export async function fetchSendingProfiles(realm: string, token?: string) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/sending-profiles`, { headers });

  if (!res.ok) throw new Error("Failed to fetch profiles");
  return res.json() as Promise<SendingProfile[]>;
}

// 3. READ ONE (GET)
export async function fetchSendingProfileById(
  realm: string,
  id: number,
  token?: string
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/sending-profiles/${id}`, { headers });

  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json() as Promise<SendingProfile>;
}

// 4. DELETE (DELETE)
export async function deleteSendingProfile(
  realm: string,
  id: number,
  token?: string
) {
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/sending-profiles/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) throw new Error("Failed to delete profile");
  return true;
}

// 5. UPDATE (PUT)
export async function updateSendingProfile(
  realm: string,
  id: number,
  data: SendingProfileCreate,
  token?: string
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/sending-profiles/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    // Tenta apanhar a mensagem de erro específica do backend se houver
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to update profile");
  }

  return res.json();
}
