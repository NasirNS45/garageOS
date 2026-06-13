import { useEffect } from "react";

const SUFFIX = "GarageOS";

/** Sets the browser tab title to "<title> · GarageOS" while mounted. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
