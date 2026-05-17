import { describe, it, expect } from 'vitest';
import {
  getCountryFlag,
  isWithin7Days,
  formatSalary,
  daysUntil,
  AFRICAN_COUNTRIES,
  CURRENCY_BY_COUNTRY,
} from '@/constants';

// ── getCountryFlag ────────────────────────────────────────────────────────
describe('getCountryFlag', () => {
  it('returns the correct flag for a known country', () => {
    expect(getCountryFlag('Lagos, Nigeria')).toBe('🇳🇬');
    expect(getCountryFlag('Accra, Ghana')).toBe('🇬🇭');
    expect(getCountryFlag('Nairobi, Kenya')).toBe('🇰🇪');
  });

  it('is case-insensitive', () => {
    expect(getCountryFlag('NIGERIA')).toBe('🇳🇬');
    expect(getCountryFlag('south africa')).toBe('🇿🇦');
  });

  it('returns 🌍 for unknown/empty locations', () => {
    expect(getCountryFlag('')).toBe('🌍');
    expect(getCountryFlag('Unknown City')).toBe('🌍');
  });
});

// ── isWithin7Days ─────────────────────────────────────────────────────────
describe('isWithin7Days', () => {
  it('returns true for a timestamp from today', () => {
    const now = { seconds: Math.floor(Date.now() / 1000) };
    expect(isWithin7Days(now)).toBe(true);
  });

  it('returns true for a timestamp from 6 days ago', () => {
    const sixDaysAgo = { seconds: Math.floor((Date.now() - 6 * 24 * 60 * 60 * 1000) / 1000) };
    expect(isWithin7Days(sixDaysAgo)).toBe(true);
  });

  it('returns false for a timestamp from 8 days ago', () => {
    const eightDaysAgo = { seconds: Math.floor((Date.now() - 8 * 24 * 60 * 60 * 1000) / 1000) };
    expect(isWithin7Days(eightDaysAgo)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isWithin7Days(null)).toBe(false);
    expect(isWithin7Days(undefined)).toBe(false);
  });

  it('works with ISO string dates', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(isWithin7Days(yesterday)).toBe(true);
  });
});

// ── formatSalary ──────────────────────────────────────────────────────────
describe('formatSalary', () => {
  it('formats a range correctly for Nigeria', () => {
    expect(formatSalary(200_000, 500_000, 'Nigeria')).toBe('₦200k – ₦500k/mo');
  });

  it('formats millions correctly', () => {
    expect(formatSalary(1_500_000, 3_000_000, 'Nigeria')).toBe('₦1.5M – ₦3.0M/mo');
  });

  it('returns N/A when both are missing', () => {
    expect(formatSalary(null, null, 'Nigeria')).toBe('N/A');
  });

  it('returns single value when max is missing', () => {
    expect(formatSalary(300_000, null, 'Nigeria')).toBe('₦300k/mo');
  });

  it('falls back to ₦ for unknown country', () => {
    expect(formatSalary(100_000, 200_000, 'Mars')).toBe('₦100k – ₦200k/mo');
  });

  it('uses the correct currency symbol for Ghana', () => {
    expect(formatSalary(5_000, 10_000, 'Ghana')).toBe('GH₵5k – GH₵10k/mo');
  });
});

// ── daysUntil ─────────────────────────────────────────────────────────────
describe('daysUntil', () => {
  it('returns null for missing deadline', () => {
    expect(daysUntil(null)).toBe(null);
    expect(daysUntil('')).toBe(null);
  });

  it('returns null for invalid date string', () => {
    expect(daysUntil('not-a-date')).toBe(null);
  });

  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(daysUntil(today)).toBe(0);
  });

  it('returns a positive number for future dates', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    expect(daysUntil(future)).toBeGreaterThan(0);
  });

  it('returns a negative number for past dates', () => {
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    expect(daysUntil(past)).toBeLessThan(0);
  });
});

// ── Constants sanity checks ───────────────────────────────────────────────
describe('AFRICAN_COUNTRIES', () => {
  it('contains Nigeria', () => expect(AFRICAN_COUNTRIES).toContain('Nigeria'));
  it('contains at least 15 countries', () => expect(AFRICAN_COUNTRIES.length).toBeGreaterThanOrEqual(15));
  it('has no duplicates', () => expect(new Set(AFRICAN_COUNTRIES).size).toBe(AFRICAN_COUNTRIES.length));
});

describe('CURRENCY_BY_COUNTRY', () => {
  it('has symbol and name for Nigeria', () => {
    expect(CURRENCY_BY_COUNTRY['Nigeria']).toEqual({ symbol: '₦', name: 'NGN' });
  });
  it('covers all major countries', () => {
    ['Nigeria', 'Ghana', 'Kenya', 'South Africa'].forEach(c =>
      expect(CURRENCY_BY_COUNTRY).toHaveProperty(c)
    );
  });
});
