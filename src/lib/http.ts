export function apiFetch(path: string, init?: RequestInit) {
  const absoluteUrl = new URL(path, window.location.origin).toString();
  return fetch(absoluteUrl, init);
}
