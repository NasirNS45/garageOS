/**
 * Validates any E.164 phone number (e.g. +923001234567).
 * Accepts: + followed by 7–15 digits.
 * Rejects empty strings and bare dial codes (e.g. "+92" alone).
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\s/g, "");
  return /^\+[1-9]\d{6,14}$/.test(cleaned);
}

/**
 * @deprecated Use isValidPhone instead.
 * Kept for backward compatibility — now delegates to isValidPhone.
 */
export function isValidPakistaniMobile(phone: string): boolean {
  return isValidPhone(phone);
}
