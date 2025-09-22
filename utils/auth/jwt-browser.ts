export function decodeJWTPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
}

export function isTokenExpiredBrowser(token: string): boolean {
  try {
    const payload = decodeJWTPayload(token);
    if (!payload || !payload.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

export function extractUserFromTokenBrowser(token: string): any {
  const payload = decodeJWTPayload(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    username: payload.username,
  };
}