import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Backend error responses come in two shapes depending on where they
// originate: a plain string (thrown directly by a controller, e.g.
// "An account with this email already exists") or an array of strings
// (Joi validation errors, one per invalid field — see validate.js on
// the backend). Indexing a string with [0] "succeeds" too — it just
// returns the string's first character — so code that did
// `json?.message?.[0] || json?.message || fallback` silently truncated
// every plain-string message down to one letter instead of ever
// reaching the fallback. This checks the actual shape instead.
export function apiErrorMessage(response: any, fallback: string): string {
  const msg = response?.message;
  if (Array.isArray(msg)) return msg[0] || fallback;
  return msg || fallback;
}

export interface DateBucket {
  label: string;
  count: number;
}

// Buckets real items into counts-per-period, covering the most recent
// `periods` buckets up to now. Every count comes from an actual item's
// date field — this never invents or randomizes values, so callers can
// feed it straight from already-fetched API data (users/events/clubs/etc).
export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string | undefined | null,
  periods: number,
  unit: 'hour' | 'day' = 'day'
): DateBucket[] {
  const now = new Date();

  const bucketStart = (periodsAgo: number) => {
    const d = new Date(now);
    if (unit === 'day') {
      d.setDate(now.getDate() - periodsAgo);
      d.setHours(0, 0, 0, 0);
    } else {
      d.setHours(now.getHours() - periodsAgo, 0, 0, 0);
    }
    return d;
  };

  const buckets: DateBucket[] = [];
  for (let periodsAgo = periods - 1; periodsAgo >= 0; periodsAgo--) {
    const start = bucketStart(periodsAgo);
    const label = unit === 'day'
      ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : start.toLocaleTimeString('en-US', { hour: 'numeric' });
    buckets.push({ label, count: 0 });
  }

  items.forEach((item) => {
    const raw = getDate(item);
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return;

    for (let i = 0; i < buckets.length; i++) {
      const periodsAgo = buckets.length - 1 - i;
      const start = bucketStart(periodsAgo);
      const end = new Date(start);
      if (unit === 'day') end.setDate(start.getDate() + 1);
      else end.setHours(start.getHours() + 1);

      if (d >= start && d < end) {
        buckets[i].count++;
        break;
      }
    }
  });

  return buckets;
}

export interface CountBucket {
  label: string;
  count: number;
}

// Counts real items by a category (e.g. event status, club active/inactive).
// Skips items with no value for the field rather than inventing a bucket.
export function countBy<T>(
  items: T[],
  getCategory: (item: T) => string | undefined | null
): CountBucket[] {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const raw = getCategory(item);
    if (!raw) return;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}