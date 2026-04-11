import { auth } from '@/lib/firebase';

/**
 * Returns a fresh Firebase ID token from the currently signed-in user.
 * Firebase SDK automatically refreshes the token if it has expired.
 *
 * @param forceRefresh – if true, forces a token refresh even if the cached
 *                       token hasn't expired yet. Default: false.
 * @returns the ID token string, or null if no user is signed in.
 */
export async function getFirebaseToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken(forceRefresh);
  } catch (err) {
    console.warn('[getFirebaseToken] Failed to refresh token:', err);
    return null;
  }
}
