const DEFAULT_BRAND = "#1d4ed8";

export function resolveBrandColor(color?: string | null): string {
  return color?.trim() || DEFAULT_BRAND;
}

export function brandHeaderStyle(color?: string | null): { background: string } {
  const brand = resolveBrandColor(color);
  return {
    background: `linear-gradient(to bottom right, ${brand}, color-mix(in srgb, ${brand} 72%, #0f172a))`,
  };
}

export function brandButtonClass(color?: string | null): { backgroundColor: string } {
  return { backgroundColor: resolveBrandColor(color) };
}

export function brandAccentStyle(color?: string | null): { color: string } {
  return { color: resolveBrandColor(color) };
}

export function brandBorderStyle(color?: string | null): { borderColor: string } {
  return { borderColor: resolveBrandColor(color) };
}
