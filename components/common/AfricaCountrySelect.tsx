'use client';
import { AFRICAN_COUNTRIES } from '@/constants';

interface Props {
  value: string;
  onChange: (v: string) => void;
  includeAll?: boolean;
  className?: string;
}

export default function AfricaCountrySelect({ value, onChange, includeAll, className = '' }: Props) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white ${className}`}>
      {includeAll && <option value="">🌍 All Africa</option>}
      {(AFRICAN_COUNTRIES as string[]).map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}
