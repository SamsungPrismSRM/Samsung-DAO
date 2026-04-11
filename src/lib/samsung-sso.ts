/**
 * Samsung corporate Google SSO: only @samsung.com (and optional extra domains) may use Google sign-in.
 * Configure with VITE_SAMSUNG_SSO_EMAIL_SUFFIXES (comma-separated), default "samsung.com".
 */

export function getSamsungSsoEmailSuffixes(): string[] {
  const raw = import.meta.env.VITE_SAMSUNG_SSO_EMAIL_SUFFIXES;
  if (raw && String(raw).trim()) {
    return String(raw)
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return ['samsung.com'];
}

export function isSamsungCorporateGoogleEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return getSamsungSsoEmailSuffixes().some((suffix) => e.endsWith(`@${suffix}`));
}

export const SAMSUNG_GOOGLE_SSO_MESSAGE =
  'Use your Samsung Google Workspace account (e.g. @samsung.com). Personal Gmail and other Google accounts are not allowed.';
