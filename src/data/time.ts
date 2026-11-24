/** Fixed anchor so demo dates are deterministic. */
const ANCHOR = Date.UTC(2026, 10, 16, 9, 0, 0);

export const daysAgo = (days: number, hours = 0): string =>
  new Date(ANCHOR - days * 86_400_000 - hours * 3_600_000).toISOString();
