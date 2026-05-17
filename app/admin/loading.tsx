import { TableSkeleton } from '@/components/common/Skeletons';
export default function Loading() {
  return <div className="container mx-auto px-4 py-8 max-w-7xl"><TableSkeleton rows={8} /></div>;
}
