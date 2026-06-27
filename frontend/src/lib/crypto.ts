/**
 * Pre-hash a password on the client before sending to the backend.
 *
 * Output is BCrypted server-side; this layer only ensures the raw plaintext
 * never leaves the browser. Salt is the username (deterministic, so the
 * backend can verify without round-tripping).
 */
export async function hashPassword(username: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${username}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
