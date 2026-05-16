import { API_URL } from "../config/api";
import { sanitizePublicErrorMessage } from "../utils/publicErrorMessage";

export const DEFAULT_DECART_MODEL =
  process.env.EXPO_PUBLIC_DECART_REALTIME_MODEL?.trim() || "lucy-vton-2";

export const LIVE_VTON_PROMPT =
  process.env.EXPO_PUBLIC_DECART_VTON_PROMPT?.trim() ||
  "Virtual try-on: realistically dress the person in the reference garment. Preserve identity, pose, and lighting where possible.";

export const LIVE_MIRROR =
  process.env.EXPO_PUBLIC_DECART_LIVE_MIRROR === "true"
    ? "true"
    : process.env.EXPO_PUBLIC_DECART_LIVE_MIRROR === "false"
      ? "false"
      : "auto";

export function formatLiveSessionDuration(seconds: number) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  if (s < 60) return `${s} second${s === 1 ? "" : "s"}`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (r === 0) return `${m} minute${m === 1 ? "" : "s"}`;
  return `${m} minute${m === 1 ? "" : "s"} ${r} second${r === 1 ? "" : "s"}`;
}

export type DecartRealtimeCredentials = {
  apiKey: string;
  modelId: string;
};

export async function resolveDecartRealtimeApiKey(token: string): Promise<DecartRealtimeCredentials> {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL in mobile app environment.");
  }

  const response = await fetch(`${API_URL}/api/decart/realtime-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json().catch(() => ({}))) as {
    apiKey?: string;
    modelId?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      sanitizePublicErrorMessage(data.message || "Could not start a live session. Please sign in and try again.")
    );
  }

  const apiKey = data.apiKey;
  if (!apiKey) {
    throw new Error("Live session could not be started. Please try again.");
  }

  const modelId =
    typeof data.modelId === "string" && data.modelId.trim() ? data.modelId.trim() : DEFAULT_DECART_MODEL;

  return { apiKey, modelId };
}
