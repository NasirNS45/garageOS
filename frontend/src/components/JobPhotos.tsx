import { useRef, useState } from "react";
import { Camera, ImageIcon, Loader2, Trash2, X } from "lucide-react";
import { usePhotos, useUploadPhoto, useDeletePhoto } from "../hooks/usePhotos";
import { useToast } from "../context/ToastContext";

const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/** Collapsible photo gallery for a job card. Lazy-loads photos when opened. */
export default function JobPhotos({
  cardId,
  canEdit,
}: {
  cardId: string;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: photos = [], isLoading } = usePhotos(cardId, open);
  const upload = useUploadPhoto(cardId);
  const remove = useDeletePhoto(cardId);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast("Image is too large (max 8 MB)", "error");
      return;
    }
    upload.mutate(file, {
      onSuccess: () => toast("Photo added", "success"),
      onError: () => toast("Upload failed. Photo storage may be unavailable.", "error"),
    });
  };

  return (
    <div className="mt-3 border-t border-slate-100 dark:border-slate-700 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[var(--brand)] transition"
      >
        <ImageIcon size={13} />
        {open ? "Hide photos" : "Photos"}
        {open && photos.length > 0 && (
          <span className="text-slate-400">({photos.length})</span>
        )}
      </button>

      {open && (
        <div className="mt-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <Loader2 size={14} className="animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => (
                <div key={p.id} className="relative group">
                  <button onClick={() => setLightbox(p.url)} className="block">
                    <img
                      src={p.url}
                      alt={p.caption ?? "Job photo"}
                      loading="lazy"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                    />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() =>
                        remove.mutate(p.id, {
                          onError: () => toast("Could not delete photo", "error"),
                        })
                      }
                      aria-label="Delete photo"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow opacity-90 hover:opacity-100 active:scale-95"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}

              {canEdit && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={upload.isPending}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:border-[var(--brand)] hover:text-[var(--brand)] transition active:scale-95 disabled:opacity-50"
                  aria-label="Add photo"
                >
                  {upload.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}
                </button>
              )}

              {!canEdit && photos.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-2">No photos.</p>
              )}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={28} />
          </button>
          <img
            src={lightbox}
            alt="Job photo"
            className="max-w-full max-h-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
