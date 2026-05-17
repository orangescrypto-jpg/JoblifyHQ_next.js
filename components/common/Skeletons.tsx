'use client';
import { ReactNode } from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  [key: string]: any;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={clsx('animate-pulse bg-gray-200 dark:bg-gray-700 rounded', className)} />
  );
}

export function JobCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function ScholarshipCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-28 rounded-lg flex-shrink-0" />
        </div>
      </div>
      <div className="card p-6 space-y-3">
        <Skeleton className="h-6 w-40 mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className={`h-4 w-${['full', '5/6', 'full', '4/5', '3/4'][i]}`} />
        ))}
      </div>
      <div className="card p-6 space-y-3">
        <Skeleton className="h-6 w-32 mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="card p-5 space-y-4">
        <Skeleton className="h-6 w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface PageLoadingProps {
  children?: ReactNode;
}

export function PageLoading({ children }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      {children && <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>}
    </div>
  );
}
