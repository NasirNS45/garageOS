import type { BadgeTone } from "./Badge";

/** Map a job-card status to a semantic Badge/IconTile tone. */
export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "info";
    case "pending":
      return "warning";
    case "cancelled":
      return "neutral";
    default:
      return "neutral";
  }
}
