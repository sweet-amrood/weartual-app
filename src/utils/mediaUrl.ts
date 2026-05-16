import { API_URL } from "../config/api";

/** Turn relative paths from the API into a full URL for `<Image source={{ uri }} />`. */
export function resolveMediaUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (pathOrUrl == null || pathOrUrl === "") return undefined;
  const s = pathOrUrl.trim();
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("file:")) return s;
  if (!API_URL) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${API_URL}${path}`;
}
