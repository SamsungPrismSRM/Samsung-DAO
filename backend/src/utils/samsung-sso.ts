/**
 * Enforce Samsung corporate Google SSO when the Firebase session used Google as the provider.
 * Configure allowed email domains with SAMSUNG_SSO_EMAIL_SUFFIXES (comma-separated), default "samsung.com".
 */

export const FIREBASE_GOOGLE_SIGN_IN_PROVIDER = 'google.com';

export function getSamsungSsoEmailSuffixes(): string[] {
  const raw = process.env.SAMSUNG_SSO_EMAIL_SUFFIXES || 'samsung.com';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isSamsungCorporateGoogleEmail(email: string): boolean {
  const e = email.toLowerCase().trim();
  return getSamsungSsoEmailSuffixes().some((suffix) => e.endsWith(`@${suffix}`));
}

export function assertFirebaseGoogleIsSamsungSso(
  signInProvider: string | undefined,
  email: string | undefined
): { ok: true } | { ok: false; status: number; error: string } {
  if (signInProvider !== FIREBASE_GOOGLE_SIGN_IN_PROVIDER) {
    return { ok: true };
  }
  if (!email) {
    return {
      ok: false,
      status: 403,
      error: 'Samsung Google SSO requires an email on your Google account.',
    };
  }
  if (!isSamsungCorporateGoogleEmail(email)) {
    return {
      ok: false,
      status: 403,
      error:
        'Google sign-in is restricted to Samsung SSO. Use your Samsung-issued Google account (e.g. @samsung.com).',
    };
  }
  return { ok: true };
}
