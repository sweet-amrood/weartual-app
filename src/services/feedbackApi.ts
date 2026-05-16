import { API_URL } from "../config/api";

export const submitFeedback = async (payload: {
  name: string;
  email: string;
  message: string;
}) => {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL in mobile app environment.");
  }

  const response = await fetch(`${API_URL}/api/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok) {
    const firstFieldError = Array.isArray(data.errors) ? data.errors[0]?.message : "";
    throw new Error(firstFieldError || data.message || "Failed to submit feedback");
  }

  return data;
};
