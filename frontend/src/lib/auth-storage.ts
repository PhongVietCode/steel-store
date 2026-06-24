const TOKEN_KEY = 'steelstore.token';
const EXPIRES_KEY = 'steelstore.expiresAt';

export function loadToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_KEY);
  if (!token || !expiresAt) return null;
  if (Date.parse(expiresAt) <= Date.now()) {
    clearToken();
    return null;
  }
  return token;
}

export function saveToken(token: string, expiresAt: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_KEY, expiresAt);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}
