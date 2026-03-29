import { describe, expect, it } from 'vitest';
import { formatDateVN, getEntityTimestamp, parseDateVN } from './date';

describe('admin date utils', () => {
  it('parses DD/MM/YYYY strings correctly', () => {
    const result = parseDateVN('29/03/2026');

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(29);
  });

  it('extracts timestamps from fallback date fields', () => {
    const timestamp = getEntityTimestamp({ date: '29/03/2026' });

    expect(timestamp).toBe(parseDateVN('29/03/2026').getTime());
  });

  it('formats Firestore-like dates into vi-VN strings', () => {
    const result = formatDateVN({ toDate: () => new Date('2026-03-29T00:00:00.000Z') });

    expect(result).toContain('2026');
  });
});
