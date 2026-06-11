import type { AxiosError } from "axios";

interface PydanticDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface ApiErrorShape {
  detail: string | PydanticDetail[];
}

/**
 * Parse an Axios error from our FastAPI backend into a flat errors map.
 *
 * Keys are backend field names (e.g. "customer_phone", "mobile").
 * "_form" is the key for errors that cannot be attributed to a specific field.
 *
 * Handles two shapes:
 *   - Pydantic 422: { detail: [{ loc: [..., "field"], msg: "..." }] }
 *   - Domain error: { detail: "Human-readable message" }
 */
export function parseApiError(error: unknown): Record<string, string> {
  const axiosErr = error as AxiosError<ApiErrorShape>;
  const detail = axiosErr?.response?.data?.detail;

  if (!detail) {
    return { _form: "An unexpected error occurred. Please try again." };
  }

  // Pydantic 422: array of per-field errors
  if (Array.isArray(detail)) {
    const errors: Record<string, string> = {};
    for (const d of detail) {
      // loc shape: ["body", "field_name"] or ["body", "field_name", index, ...]
      const fieldName = d.loc.find(
        (part, idx) => idx > 0 && typeof part === "string"
      ) as string | undefined;
      const key = fieldName ?? "_form";
      // Keep only the first message per field
      if (!errors[key]) {
        errors[key] = d.msg;
      }
    }
    return errors;
  }

  // Domain / application error: flat string
  return { _form: detail };
}
