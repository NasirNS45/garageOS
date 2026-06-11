import re

_STRIP_PATTERN = re.compile(r"[\s\-\(\)]")


def normalize_mobile(raw: str) -> str:
    """
    Normalize a Pakistani mobile number to E.164 (+923xxxxxxxxx).

    Accepts:
      03xxxxxxxxx   -> +923xxxxxxxxx
      3xxxxxxxxx    -> +923xxxxxxxxx
      923xxxxxxxxx  -> +923xxxxxxxxx
      +923xxxxxxxxx -> +923xxxxxxxxx (already normalized)

    Raises ValueError if the number does not match a valid PK pattern.
    """
    cleaned = _STRIP_PATTERN.sub("", raw)

    if cleaned.startswith("+92"):
        number = cleaned
    elif cleaned.startswith("92"):
        number = f"+{cleaned}"
    elif cleaned.startswith("0"):
        number = f"+92{cleaned[1:]}"
    elif len(cleaned) == 10 and cleaned[0] in "3":
        number = f"+92{cleaned}"
    else:
        raise ValueError(f"Cannot normalize mobile number: {raw!r}")

    if not re.fullmatch(r"\+923\d{9}", number):
        raise ValueError(f"Invalid Pakistani mobile number: {raw!r}")

    return number
