import { API_URL, deleteImageRequestUrl } from "../config/api";

export type ImageRecord = {
  id: string;
  imageUrl?: string;
  garmentUrl?: string;
  resultUrl?: string;
  status?: string;
  resultType?: "image" | "video";
  error?: string | null;
  createdAt: string;
};

/** Backend often sends Mongo `_id`; mobile + DELETE route expect `id`. */
type RawImageRecord = Partial<ImageRecord> & { _id?: string };

export function normalizeImageRecord(raw: RawImageRecord): ImageRecord | null {
  const idRaw = raw.id ?? raw._id;
  const id = typeof idRaw === "string" ? idRaw.trim() : idRaw != null ? String(idRaw) : "";
  if (!id) {
    return null;
  }
  return {
    ...raw,
    id,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
  } as ImageRecord;
}

type ListMyImagesResponse = {
  images: RawImageRecord[];
};

export const listMyImages = async (token: string) => {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL in mobile app environment.");
  }

  const response = await fetch(`${API_URL}/api/images/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json().catch(() => ({}))) as
    | ListMyImagesResponse
    | { message?: string };

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? "Request failed");
  }

  const raw = (data as ListMyImagesResponse).images ?? [];
  return raw.map(normalizeImageRecord).filter((x): x is ImageRecord => x != null);
};

export type DeleteImageResult = {
  lookCount?: number;
};

export const getMyLookCount = async (token: string): Promise<number> => {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL in mobile app environment.");
  }

  const response = await fetch(`${API_URL}/api/images/me/look-count`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json().catch(() => ({}))) as { lookCount?: unknown; message?: string };

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? "Failed to load look count");
  }

  const n = Number((data as { lookCount?: unknown }).lookCount);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Invalid look count from server");
  }
  return n;
};

export const deleteMyImage = async (token: string, imageId: string): Promise<DeleteImageResult> => {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL in mobile app environment.");
  }
  const trimmed = typeof imageId === "string" ? imageId.trim() : "";
  if (!trimmed || trimmed === "undefined") {
    throw new Error("Missing job id — cannot delete. Try reloading history.");
  }

  const response = await fetch(deleteImageRequestUrl(trimmed), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    lookCount?: unknown;
  };

  if (!response.ok) {
    throw new Error(
      (data as { message?: string }).message ?? `Delete failed (${response.status})`
    );
  }

  const lc = Number(data.lookCount);
  return {
    lookCount: Number.isFinite(lc) && lc >= 0 ? lc : undefined,
  };
};

export type UploadImageResult = {
  job: ImageRecord;
  lookCount?: number;
};

export type DatasetSample = {
  fileName: string;
  url: string;
};

export const listDatasetSamples = async (type: "image" | "cloth", offset = 0) => {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL in mobile app environment.");
  }

  const response = await fetch(
    `${API_URL}/api/images/samples?type=${encodeURIComponent(type)}&offset=${encodeURIComponent(String(offset))}`,
    { method: "GET" }
  );

  const data = (await response.json().catch(() => ({}))) as {
    samples?: DatasetSample[];
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  const samples = (data.samples ?? []).map((sample) => ({
    ...sample,
    url: sample.url.startsWith("http") ? sample.url : `${API_URL}${sample.url}`,
  }));

  return { samples };
};

export const uploadMyImage = async (params: {
  token: string;
  imageAsset: { uri: string; mimeType?: string | null; fileName?: string | null };
  garmentAsset: { uri: string; mimeType?: string | null; fileName?: string | null };
}) => {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL in mobile app environment.");
  }

  const formData = new FormData();
  formData.append("image", {
    uri: params.imageAsset.uri,
    type: params.imageAsset.mimeType ?? "image/jpeg",
    name: params.imageAsset.fileName ?? "person.jpg",
  } as unknown as Blob);
  formData.append("garment", {
    uri: params.garmentAsset.uri,
    type: params.garmentAsset.mimeType ?? "image/jpeg",
    name: params.garmentAsset.fileName ?? "garment.jpg",
  } as unknown as Blob);

  const response = await fetch(`${API_URL}/api/images/me`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as
    | { job?: RawImageRecord; lookCount?: unknown; message?: string }
    | { message?: string };

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? "Upload failed");
  }

  const rawJob = (data as { job?: RawImageRecord }).job;
  if (!rawJob) {
    throw new Error("Upload succeeded but server returned no job.");
  }
  const job = normalizeImageRecord(rawJob);
  if (!job) {
    throw new Error("Invalid job payload from server.");
  }
  const lc = Number((data as { lookCount?: unknown }).lookCount);
  return {
    job,
    lookCount: Number.isFinite(lc) && lc >= 0 ? lc : undefined,
  };
};
