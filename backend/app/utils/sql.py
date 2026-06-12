"""SQL helper utilities."""


def escape_like(value: str, escape_char: str = "\\") -> str:
    """Escape LIKE/ILIKE wildcards in user-supplied input.

    Must be paired with ``.ilike(pattern, escape=escape_char)`` so the
    database treats ``%`` and ``_`` in the input literally.
    """
    return (
        value.replace(escape_char, escape_char + escape_char)
        .replace("%", escape_char + "%")
        .replace("_", escape_char + "_")
    )
