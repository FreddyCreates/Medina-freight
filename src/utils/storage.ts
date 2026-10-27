/**
 * Utility for safe localStorage access with QuotaExceededError mitigation.
 */

export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`[LocalStorage] QuotaExceededError or write failure for key "${key}":`, error);
    try {
      // Attempt pruning if value is an array (e.g. projects, invoices, logs)
      if (Array.isArray(value)) {
        const pruned = value.slice(0, 30).map((item) => {
          if (item && typeof item === 'object') {
            const copy = { ...item };
            // Strip large base64 or raw document payloads
            delete (copy as any).base64Data;
            delete (copy as any).fileContent;
            delete (copy as any).previewUrl;
            delete (copy as any).rawOcrHighlights;
            return copy;
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(pruned));
        return true;
      }
    } catch (fallbackError) {
      console.error(`[LocalStorage] Failed fallback write for key "${key}":`, fallbackError);
    }
    return false;
  }
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch (error) {
    console.warn(`[LocalStorage] Error reading key "${key}":`, error);
    return fallback;
  }
}
