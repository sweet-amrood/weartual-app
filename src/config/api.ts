const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_URL = rawApiUrl?.replace(/\/+$/, "") ?? "";

/**
 * Path template for deleting one job by id. Must contain `:id` (same segment as backend `:jobId`).
 * Backend: DELETE `/api/images/me/:jobId`
 */
const DELETE_IMAGE_PATH_TEMPLATE =
  process.env.EXPO_PUBLIC_DELETE_IMAGE_PATH ?? "/api/images/me/:id";

export function deleteImageRequestUrl(imageId: string): string {
  if (!DELETE_IMAGE_PATH_TEMPLATE.includes(":id")) {
    throw new Error(
      "EXPO_PUBLIC_DELETE_IMAGE_PATH must include an :id placeholder (e.g. /api/images/:id)."
    );
  }
  const path = DELETE_IMAGE_PATH_TEMPLATE.replace(":id", encodeURIComponent(imageId));
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}
