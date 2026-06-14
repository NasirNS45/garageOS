import { api } from "../api/axios";

/** Fire-and-forget pilot analytics event (never blocks UI). */
export function trackPilotEvent(
  eventName: string,
  metadata?: Record<string, unknown>,
): void {
  void api
    .post("/analytics/events", { event_name: eventName, metadata })
    .catch(() => {});
}
