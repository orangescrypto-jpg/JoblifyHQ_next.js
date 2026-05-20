// src/services/index.ts
// ─── Service Layer — Central Export ──────────────────────────────────────────
// Import all services from here in your app code.
//
// Usage:
//   import { JobsService } from '@/src/services'
//   import { AuthService } from '@/src/services'
//
// Never import from 'firebase/*' directly outside of src/services/providers/firebase/

export { JobsService }        from '@/src/services/jobs';
export { ScholarshipsService } from '@/src/services/scholarships';
export { BlogService }         from '@/src/services/blog';
export { AuthService }         from '@/src/services/auth';
export { DashboardService }    from '@/src/services/dashboard';
