const ACCESS_TOKEN_KEY = 'teamflow.accessToken';

export function getStoredAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function storeAccessToken(token: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAccessToken() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
