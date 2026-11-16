/**
 * apiFetch — authenticated fetch wrapper used throughout the app.
 *
 * Drop-in for fetch(): same signature, same return type.
 * Adds:
 *   • Authorization: Bearer <token> on every request automatically
 *   • 401 → dispatches 'hii:session-expired' → AuthContext logs out
 *   • 429 → throws a readable "rate limited" error
 *   • Network errors → throws a readable message instead of TypeError
 *
 * Usage (replaces raw fetch in every useQuery / useMutation):
 *   import { apiFetch } from '../lib/apiFetch';
 *   const res = await apiFetch(token, `${API_BASE}/user/get_all_users`);
 */

export async function apiFetch(
  token: string | null,
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(input, { ...init, headers });
  } catch (err) {
    // Network failure — no response at all (offline, DNS, CORS preflight)
    throw new Error('Network error — check your connection and try again.');
  }

  if (res.status === 401) {
    // Fire a custom event that AuthContext listens to.
    // Using an event (not a direct import) keeps this file free of
    // React dependencies so it can be used anywhere.
    window.dispatchEvent(new CustomEvent('hii:session-expired'));
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (res.status === 429) {
    throw new Error('Too many requests — please wait a moment and try again.');
  }

  return res;
}
