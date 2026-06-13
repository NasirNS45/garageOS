import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "../api/axios";

export interface JobPhoto {
  id: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export type PhotoContentType = "image/jpeg" | "image/png" | "image/webp";

interface PresignResponse {
  upload_url: string;
  object_key: string;
  public_url: string;
}

export function usePhotos(cardId: string, enabled = true) {
  return useQuery({
    queryKey: ["job-cards", cardId, "photos"],
    queryFn: () =>
      api.get<JobPhoto[]>(`/job-cards/${cardId}/photos`).then((r) => r.data),
    enabled,
  });
}

/**
 * Full upload flow: presign → PUT file directly to storage → record the photo.
 * Returns the saved photo record.
 */
export function useUploadPhoto(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<JobPhoto> => {
      const contentType = file.type as PhotoContentType;
      const { data: presign } = await api.post<PresignResponse>(
        `/job-cards/${cardId}/photos/presign`,
        { content_type: contentType }
      );
      // Direct upload to object storage (not through our API)
      await axios.put(presign.upload_url, file, {
        headers: { "Content-Type": contentType },
      });
      const { data: photo } = await api.post<JobPhoto>(`/job-cards/${cardId}/photos`, {
        object_key: presign.object_key,
        public_url: presign.public_url,
      });
      return photo;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["job-cards", cardId, "photos"] }),
  });
}

export function useDeletePhoto(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) =>
      api.delete(`/job-cards/${cardId}/photos/${photoId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["job-cards", cardId, "photos"] }),
  });
}
