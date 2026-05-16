import { API_URL } from "../config/api";

/**
 * Backend contract (Mongo user document + these HTTP routes):
 *
 * - `GET /api/auth/me` → `{ user }` (include optional `avatarUrl`, `avatarPreset`)
 * - `PATCH /api/auth/me` → JSON body updates the authenticated user, persist to Mongo:
 *   - `{ username?, email?, currentPassword? }` — require `currentPassword` when `email` or `username` changes
 *   - `{ avatarPreset?, avatarUrl? }` — set `avatarPreset` to a built-in id (`aurora`, `river`, `sage`, `nova`, `orbit`, `pixel`) and `avatarUrl: null` for a default avatar only
 * - `POST /api/auth/me/avatar` → multipart field `avatar` (image file); save file, set `avatarUrl`, clear `avatarPreset` (or keep both per your schema)
 *
 * Optional: return `{ user, token }` from PATCH when email change invalidates the old JWT.
 */

type RequestOptions = RequestInit & {
  token?: string | null;
};

const request = async <T>(path: string, options: RequestOptions = {}) => {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL in mobile app environment.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (e) {
    const hint =
      !API_URL
        ? "App API URL was not set at build time. Rebuild with EXPO_PUBLIC_API_URL in EAS."
        : `Cannot reach ${API_URL}. Use the same Wi‑Fi as your PC, start the backend, and allow port 5001 in the firewall.`;
    throw new Error(
      e instanceof Error && /network request failed/i.test(e.message) ? hint : e instanceof Error ? e.message : "Network error"
    );
  }

  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data;
};

export type User = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  avatarUrl?: string | null;
  avatarPreset?: string | null;
};

export function normalizeUser(raw: Record<string, unknown>): User {
  const idRaw = raw.id ?? raw._id;
  const id = idRaw != null ? String(idRaw) : "";
  const av = raw.avatarUrl;
  const ap = raw.avatarPreset;
  return {
    id,
    username: String(raw.username ?? ""),
    email: String(raw.email ?? ""),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    avatarUrl: av != null && String(av).trim() !== "" ? String(av) : null,
    avatarPreset: ap != null && String(ap).trim() !== "" ? String(ap) : null,
  };
}

type AuthResponseRaw = {
  token: string;
  user: Record<string, unknown>;
};

type MeResponseRaw = {
  user: Record<string, unknown>;
  token?: string;
};

export const signup = async (payload: { username: string; email: string; password: string }) => {
  const data = await request<AuthResponseRaw>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { token: data.token, user: normalizeUser(data.user) };
};

export const login = async (payload: { email: string; password: string }) => {
  const data = await request<AuthResponseRaw>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { token: data.token, user: normalizeUser(data.user) };
};

export const requestPasswordReset = (payload: { email: string }) =>
  request<{ message?: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getMe = async (token: string) => {
  const data = await request<MeResponseRaw>("/api/auth/me", {
    method: "GET",
    token,
  });
  return { user: normalizeUser(data.user) };
};

export type ProfileUpdatePayload = {
  username?: string;
  email?: string;
  currentPassword?: string;
};

export const updateProfile = async (token: string, payload: ProfileUpdatePayload) => {
  const data = await request<MeResponseRaw>("/api/auth/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
  return { user: normalizeUser(data.user), token: data.token };
};

/** Select a built-in avatar id from `DEFAULT_AVATAR_OPTIONS`. Server should clear custom `avatarUrl` when preset is set. */
export const updateAvatarPreset = async (token: string, avatarPreset: string) => {
  const data = await request<MeResponseRaw>("/api/auth/me", {
    method: "PATCH",
    token,
    body: JSON.stringify({ avatarPreset, avatarUrl: null }),
  });
  return { user: normalizeUser(data.user), token: data.token };
};

export const removeProfileAvatar = async (token: string) => {
  const data = await request<MeResponseRaw>("/api/auth/me", {
    method: "PATCH",
    token,
    body: JSON.stringify({ avatarUrl: null }),
  });
  return { user: normalizeUser(data.user), token: data.token };
};

export const uploadProfileAvatar = async (
  token: string,
  asset: { uri: string; mimeType?: string | null; fileName?: string | null }
) => {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL in mobile app environment.");
  }

  const formData = new FormData();
  formData.append("avatar", {
    uri: asset.uri,
    type: asset.mimeType ?? "image/jpeg",
    name: asset.fileName ?? "avatar.jpg",
  } as unknown as Blob);

  const response = await fetch(`${API_URL}/api/auth/me/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as MeResponseRaw & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "Avatar upload failed");
  }
  if (!data.user) {
    throw new Error("Server returned no user after avatar upload.");
  }
  return { user: normalizeUser(data.user), token: data.token };
};

