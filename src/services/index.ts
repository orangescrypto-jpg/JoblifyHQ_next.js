// src/services/index.ts
// ─── Service Layer — Central Export ──────────────────────────────────────────
// ALWAYS import services from here. Never import from firebase/* directly
// outside of src/services/providers/firebase/

export { JobsService }         from '@/src/services/jobs';
export { ScholarshipsService } from '@/src/services/scholarships';
export { BlogService }         from '@/src/services/blog';
export { AuthService }         from '@/src/services/auth';
export { DashboardService }    from '@/src/services/dashboard';
export { PaymentService }      from '@/src/services/payment';
export { GigsService }         from '@/src/services/providers/firebase/gigs';
export { EscrowService }       from '@/src/services/providers/firebase/escrow';
export { FreelancerService }   from '@/src/services/providers/firebase/freelancer';
export { PlatformService }     from '@/src/services/providers/firebase/platform';

export type {
  PendingPayment,
  PaymentStatus,
  PaymentMethod,
  PaymentPlan,
  AdminPaymentSettings,
} from '@/src/services/payment';

export type { GigFilters }   from '@/src/services/providers/firebase/gigs';
export type { EscrowStatus } from '@/types';
