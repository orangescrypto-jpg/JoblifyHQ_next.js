// constants/africa.ts
// African countries list — used across filters, forms, and settings

export const AFRICAN_COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt',
  'Ethiopia', 'Uganda', 'Tanzania', 'Rwanda', 'Senegal',
  'Cameroon', 'Ivory Coast', 'Zimbabwe', 'Zambia', 'Mozambique',
  'Angola', 'Morocco', 'Tunisia', 'Algeria', 'Sudan',
  'Madagascar', 'Malawi', 'Mali', 'Burkina Faso', 'Niger',
  'Somalia', 'South Sudan', 'Botswana', 'Namibia', 'Gabon',
  'Guinea', 'Benin', 'Togo', 'Sierra Leone', 'Liberia',
  'Mauritius', 'Seychelles', 'Cape Verde', 'Gambia', 'Other',
] as const;

export type AfricanCountry = typeof AFRICAN_COUNTRIES[number];

export const GIG_CATEGORIES = [
  'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
  'Digital Marketing', 'Content Writing', 'Video Editing', 'Data Analysis',
  'Cybersecurity', 'DevOps & Cloud', 'AI & Machine Learning', 'SEO',
  'Social Media Management', 'Translation & Localization',
  'Accounting & Finance', 'Legal Services', 'Photography',
  'Voice Over', 'Virtual Assistant', 'Tutoring & Education', 'Other',
] as const;

export const JOB_TYPES = [
  'Full-time', 'Part-time', 'Contract', 'Remote',
  'Internship', 'Volunteer', 'Freelance',
] as const;

export const EXPERIENCE_LEVELS = [
  'Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director / C-Level',
] as const;

export const SALARY_CURRENCIES = ['NGN', 'USD', 'GHS', 'KES', 'ZAR', 'EGP'] as const;

export const SKILL_CATEGORIES = [
  'Engineering', 'Design', 'Marketing', 'Finance', 'Writing',
  'Data & Analytics', 'Operations', 'Legal', 'Education', 'Other',
] as const;
