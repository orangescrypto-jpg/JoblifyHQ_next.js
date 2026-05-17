import { ScholarshipCardSkeleton } from '@/components/common/Skeletons';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <ScholarshipCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
