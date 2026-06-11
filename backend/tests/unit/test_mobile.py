import pytest

from app.utils.mobile import normalize_mobile


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("03001234567", "+923001234567"),
        ("3001234567", "+923001234567"),
        ("923001234567", "+923001234567"),
        ("+923001234567", "+923001234567"),
        ("0300 123 4567", "+923001234567"),
        ("0300-123-4567", "+923001234567"),
    ],
)
def test_normalize_valid(raw: str, expected: str) -> None:
    assert normalize_mobile(raw) == expected


@pytest.mark.parametrize("bad", ["12345", "abcdefg", "00923001234567", "+1234567890"])
def test_normalize_invalid(bad: str) -> None:
    with pytest.raises(ValueError):
        normalize_mobile(bad)
