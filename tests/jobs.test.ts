import { describe, it, expect } from 'vitest';
import { sortApplicationsByBoost } from '@/services/firebase/jobs';

// ── sortApplicationsByBoost ───────────────────────────────────────────────
describe('sortApplicationsByBoost', () => {
  const makeApp = (tier, seconds) => ({
    applicantTier: tier,
    appliedAt: { seconds },
  });

  it('puts premium-annual first', () => {
    const apps = [
      makeApp('free', 1000),
      makeApp('premium-annual', 900),
      makeApp('premium', 950),
    ];
    const sorted = sortApplicationsByBoost(apps);
    expect(sorted[0].applicantTier).toBe('premium-annual');
  });

  it('orders same-tier entries by most-recent first', () => {
    const apps = [
      makeApp('premium', 500),
      makeApp('premium', 900),
      makeApp('premium', 700),
    ];
    const sorted = sortApplicationsByBoost(apps);
    expect(sorted[0].appliedAt.seconds).toBe(900);
    expect(sorted[1].appliedAt.seconds).toBe(700);
    expect(sorted[2].appliedAt.seconds).toBe(500);
  });

  it('does not mutate the original array', () => {
    const apps = [makeApp('free', 100), makeApp('premium', 50)];
    const original = [...apps];
    sortApplicationsByBoost(apps);
    expect(apps).toEqual(original);
  });

  it('handles empty array', () => {
    expect(sortApplicationsByBoost([])).toEqual([]);
  });

  it('handles undefined tier (treated as lowest priority)', () => {
    const apps = [
      makeApp(undefined, 1000),
      makeApp('free', 500),
    ];
    const sorted = sortApplicationsByBoost(apps);
    // Both are lowest tier, so most-recent comes first
    expect(sorted[0].appliedAt.seconds).toBe(1000);
  });
});

// ── JS search filter (pure logic, no Firebase) ────────────────────────────
function applySearchFilter(jobs, search) {
  if (!search) return jobs;
  const s = search.toLowerCase().trim();
  return jobs.filter(j =>
    (j.title       || '').toLowerCase().includes(s) ||
    (j.company     || '').toLowerCase().includes(s) ||
    (j.description || '').toLowerCase().includes(s) ||
    (j.category    || '').toLowerCase().includes(s)
  );
}

describe('job search filter', () => {
  const jobs = [
    { title: 'Frontend Developer', company: 'TechCorp', description: 'React job', category: 'Engineering' },
    { title: 'Marketing Manager', company: 'BrandCo',  description: 'Brand strategy', category: 'Marketing' },
    { title: 'Data Scientist',    company: 'DataInc',  description: 'ML models', category: 'Data Science' },
  ];

  it('filters by title', () => {
    const result = applySearchFilter(jobs, 'frontend');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Frontend Developer');
  });

  it('filters by company', () => {
    const result = applySearchFilter(jobs, 'datainc');
    expect(result).toHaveLength(1);
    expect(result[0].company).toBe('DataInc');
  });

  it('filters by category', () => {
    const result = applySearchFilter(jobs, 'marketing');
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Marketing');
  });

  it('returns all when search is empty', () => {
    expect(applySearchFilter(jobs, '')).toHaveLength(3);
    expect(applySearchFilter(jobs, null)).toHaveLength(3);
  });

  it('is case-insensitive', () => {
    expect(applySearchFilter(jobs, 'REACT')).toHaveLength(1);
  });

  it('returns empty array when no match', () => {
    expect(applySearchFilter(jobs, 'zzznomatch')).toHaveLength(0);
  });
});
