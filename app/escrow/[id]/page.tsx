'use client';
import { use } from 'react';
import EscrowDetail from '@/pages/EscrowDetail';
export default function EscrowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EscrowDetail escrowId={id} />;
}
