/** The canonical form of an email: trimmed, lower case. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** True when `email` may create an account (SIGNUP_ALLOWED_EMAILS). */
export function isSignupAllowed(email: string, allowlist: string[]): boolean {
  return allowlist.includes(normalizeEmail(email));
}
