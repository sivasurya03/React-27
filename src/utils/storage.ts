export const STORAGE_KEYS = {
  theme: 'lms:theme',
  session: 'lms:session',
  users: 'lms:users',
  wishlist: 'lms:wishlist',
  enrollments: 'lms:enrollments',
  learning: 'lms:learning',
  notifications: 'lms:notifications',
  recentSearches: 'lms:recent-searches',
  profiles: 'lms:profiles',
} as const;

export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode); persistence is best-effort.
  }
}

export function removeFromStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore: see saveToStorage.
  }
}

export function loadFromSessionStorage<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function saveToSessionStorage<T>(key: string, value: T): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort, see saveToStorage.
  }
}

export function removeFromSessionStorage(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore: see saveToStorage.
  }
}
