import { useEffect } from "react";
import { forceLtr } from "../stores/languageStore";

/** Force LTR/English on pre-auth, English-only pages so a persisted Urdu
 * choice never leaks a broken RTL layout onto them. */
export function useForceLtr(): void {
  useEffect(() => {
    forceLtr();
  }, []);
}
