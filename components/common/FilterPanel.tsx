'use client';

interface Filters {
  category?: string;
  type?: string;
  [key: string]: string | undefined;
}

interface FilterPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select 
        value={filters.category || ''} 
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
      >
        <option value="">All Categories</option>
        <option value="Engineering">Engineering</option>
        <option value="Design">Design</option>
        <option value="Finance">Finance</option>
        <option value="Education">Education</option>
      </select>
      <select 
        value={filters.type || ''} 
        onChange={(e) => onChange({ ...filters, type: e.target.value })}
        className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
      >
        <option value="">All Types</option>
        <option value="Full-time">Full-time</option>
        <option value="Part-time">Part-time</option>
        <option value="Remote">Remote</option>
      </select>
      <button 
        onClick={() => onChange({ category: '', type: '' })}
        className="px-4 py-2.5 text-sm text-gray-600 hover:text-primary-600 font-medium"
      >
        Clear Filters
      </button>
    </div>
  );
}
