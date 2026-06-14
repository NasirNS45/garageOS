import type { Language } from "../i18n/translations";

/**
 * Returns a short human-readable string for how long ago a date was.
 */
export function formatAge(dateStr: string, lang: Language = "en"): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60_000);
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);

  if (lang === "ur") {
    if (days >= 1) return `${days} دن`;
    if (hours >= 1) return `${hours} گھنٹے`;
    if (mins >= 1) return `${mins} منٹ`;
    return "ابھی";
  }

  if (days >= 1) return `${days}d`;
  if (hours >= 1) return `${hours}h`;
  if (mins >= 1) return `${mins}m`;
  return "just now";
}
