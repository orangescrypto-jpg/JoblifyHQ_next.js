// ─────────────────────────────────────────────────────────────────────────────
// JoblifyHQ — Shared Constants
// Single source of truth. Import from here instead of copy-pasting in pages.
// ─────────────────────────────────────────────────────────────────────────────

export const AFRICAN_COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Uganda', 'Tanzania',
  'Ethiopia', 'Rwanda', 'Senegal', "Côte d'Ivoire", 'Cameroon',
  'Zimbabwe', 'Zambia', 'Botswana', 'Namibia', 'Egypt', 'Morocco', 'Tunisia',
];

export const COUNTRY_FLAGS = {
  'Nigeria':        '🇳🇬',
  'Ghana':          '🇬🇭',
  'Kenya':          '🇰🇪',
  'South Africa':   '🇿🇦',
  'Uganda':         '🇺🇬',
  'Rwanda':         '🇷🇼',
  'Tanzania':       '🇹🇿',
  'Ethiopia':       '🇪🇹',
  'Senegal':        '🇸🇳',
  'Cameroon':       '🇨🇲',
  'Zimbabwe':       '🇿🇼',
  'Zambia':         '🇿🇲',
  'Botswana':       '🇧🇼',
  'Namibia':        '🇳🇦',
  'Egypt':          '🇪🇬',
  'Morocco':        '🇲🇦',
  'Tunisia':        '🇹🇳',
  "Côte d'Ivoire":  '🇨🇮',
  'Remote':         '🌍',
};

export const CURRENCY_BY_COUNTRY = {
  'Nigeria':      { symbol: '₦',   name: 'NGN' },
  'Ghana':        { symbol: 'GH₵', name: 'GHS' },
  'Kenya':        { symbol: 'KSh', name: 'KES' },
  'South Africa': { symbol: 'R',   name: 'ZAR' },
  'Uganda':       { symbol: 'USh', name: 'UGX' },
  'Tanzania':     { symbol: 'TSh', name: 'TZS' },
  'Ethiopia':     { symbol: 'Br',  name: 'ETB' },
  'Rwanda':       { symbol: 'FRw', name: 'RWF' },
  'Egypt':        { symbol: 'E£',  name: 'EGP' },
  'Morocco':      { symbol: 'MAD', name: 'MAD' },
};

export const CITIES_BY_COUNTRY = {
  'Nigeria':       ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Kaduna', 'Benin City', 'Aba', 'Onitsha'],
  'Ghana':         ['Accra', 'Kumasi', 'Tamale', 'Tema'],
  'Kenya':         ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
  'South Africa':  ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'],
  'Uganda':        ['Kampala', 'Entebbe', 'Gulu'],
  'Tanzania':      ['Dar es Salaam', 'Arusha', 'Mwanza'],
  'Ethiopia':      ['Addis Ababa', 'Dire Dawa'],
  'Rwanda':        ['Kigali'],
  'Senegal':       ['Dakar', 'Thiès'],
  "Côte d'Ivoire": ['Abidjan', 'Bouaké'],
  'Cameroon':      ['Douala', 'Yaoundé'],
  'Zimbabwe':      ['Harare', 'Bulawayo'],
  'Zambia':        ['Lusaka', 'Ndola'],
  'Botswana':      ['Gaborone', 'Francistown'],
  'Namibia':       ['Windhoek'],
  'Egypt':         ['Cairo', 'Alexandria', 'Giza'],
  'Morocco':       ['Casablanca', 'Rabat', 'Marrakech', 'Fez'],
  'Tunisia':       ['Tunis', 'Sfax'],
};

export const EXPERIENCE_LEVELS = [
  'Entry (0-2 yrs)',
  'Mid (3-5 yrs)',
  'Senior (5-10 yrs)',
  'Lead / Manager',
];

export const EXP_COLORS = {
  'Entry (0-2 yrs)':   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Mid (3-5 yrs)':     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Senior (5-10 yrs)': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Lead / Manager':    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export const JOB_TYPES = [
  'Full-time', 'Part-time', 'Remote', 'Contract',
  'Internship', 'Entry-level', 'Graduate Trainee', 'NYSC', 'Volunteer',
];

export const JOB_CATEGORIES = [
  'Engineering', 'Design', 'Marketing', 'Sales', 'Finance',
  'Education', 'Healthcare', 'STEM', 'Agriculture', 'Law', 'Media', 'Tech',
  'Business', 'Accounting', 'Human Resources', 'Logistics & Supply Chain',
  'Hospitality & Tourism', 'Real Estate', 'Construction', 'Energy & Oil',
  'NGO & Non-Profit', 'Government & Public Sector', 'Research & Development',
  'Social Work', 'Journalism', 'Sports & Fitness', 'Arts & Entertainment',
  'Information Technology', 'Cybersecurity', 'Data Science', 'Aviation',
  'Banking', 'Insurance', 'Telecommunications', 'Other',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the flag emoji for a location string, falling back to 🌍 */
export function getCountryFlag(location = '') {
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (location.toLowerCase().includes(country.toLowerCase())) return flag;
  }
  return '🌍';
}

/** True if the job/post was created within the last 7 days */
export function isWithin7Days(createdAt: { seconds: number } | string | null | undefined): boolean {
  if (!createdAt) return false;
  const posted = (createdAt as { seconds: number })?.seconds
    ? new Date((createdAt as { seconds: number }).seconds * 1000)
    : new Date(createdAt as string);
  return (Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24) <= 7;
}

/** Formats a salary range to a compact string like "₦200k – ₦500k/mo" */
export function formatSalary(min: number | null, max: number | null, country: string): string {
  const currency = (CURRENCY_BY_COUNTRY as Record<string, { symbol: string; name: string }>)[country] || { symbol: '₦' };
  const fmt = (n: number | null): string | null => {
    if (!n) return null;
    if (n >= 1_000_000) return `${currency.symbol}${(n / 1_000_000).toFixed(1)}M`;
    return `${currency.symbol}${(n / 1_000).toFixed(0)}k`;
  };
  const fMin = fmt(min);
  const fMax = fmt(max);
  if (!fMin && !fMax) return 'N/A';
  if (!fMax) return `${fMin}/mo`;
  return `${fMin} – ${fMax}/mo`;
}

/** Days until a deadline date string. Returns null if absent/invalid. */
export function daysUntil(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(deadline);
  if (isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
