THEME_COLORS: dict[str, str] = {
    "blue": "#1D4ED8",
    "emerald": "#059669",
    "purple": "#7C3AED",
    "rose": "#E11D48",
    "teal": "#0D9488",
}

DEFAULT_THEME = "blue"


def brand_color_for_theme(accent_theme: str | None) -> str:
    """Resolve a workshop accent theme name to its hex brand color."""
    theme = accent_theme or DEFAULT_THEME
    return THEME_COLORS.get(theme, THEME_COLORS[DEFAULT_THEME])
