'use client';
import { use } from 'react';
import GigDetail from '@/pages/GigDetail';
export default function GigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <GigDetail gigId={id} />;
}
