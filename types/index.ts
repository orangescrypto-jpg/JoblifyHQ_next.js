import type { ReactNode } from 'react';

// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'employer' | 'admin';
export type UserTier = 'free' | 'premium' | 'premium-annual' | 'employer-free' | 'employer-pro' | 'employer-enterprise';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  displayName?: string;
  role: UserRole;
  company: string | null;
  tier: UserTier;
  photoURL: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  provider: string;
  employerTier?: string;
}

// ─── Job ────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;           // Full-time | Part-time | Contract | Remote
  salary?: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  tags?: string[];
  logo?: string;
  postedAt: unknown;
  deadline?: string;
  isRemote?: boolean;
  isFeatured?: boolean;
  isPromoted?: boolean;
  status: 'active' | 'closed' | 'draft';
  employerId?: string;
  applicationCount?: number;
  externalUrl?: string;
  org?: string;
  country?: string;
}

// ─── Scholarship ─────────────────────────────────────────────────────────────

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  description: string;
  eligibility?: string[];
  tags?: string[];
  logo?: string;
  postedAt: unknown;
  country?: string;
  level?: string;         // Undergraduate | Postgraduate | PhD
  status: 'active' | 'closed';
  externalUrl?: string;
  org?: string;
  location?: string;
  type?: string;
}

// ─── Blog ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorPhoto?: string;
  coverImage?: string;
  tags?: string[];
  publishedAt: unknown;
  updatedAt?: unknown;
  slug?: string;
  status: 'published' | 'draft';
  views?: number;
}

export interface BlogComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: unknown;
}

// ─── Application ─────────────────────────────────────────────────────────────

export type ApplicationStatus = 'Submitted' | 'Under Review' | 'Under review' | 'Shortlisted' | 'Rejected' | 'Accepted' | 'Interview' | 'Viewed' | 'Contacted' | 'New';
export type ApplicationType = 'job' | 'scholarship';

export interface Application {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: ApplicationType;
  opportunityType?: string;
  opportunityId: string;
  company?: string;
  title: string;
  org: string;
  cvUrl: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: unknown;
  updatedAt: unknown;
}

// ─── Saved Items ─────────────────────────────────────────────────────────────

export interface SavedItem {
  id: string;
  userId: string;
  type: 'job' | 'scholarship';
  jobId?: string;
  scholarshipId?: string;
  itemData: Job | Scholarship;
  savedAt: unknown;
}

// ─── Employer ────────────────────────────────────────────────────────────────

export interface EmployerStats {
  activeJobs: number;
  totalApplications: number;
  promotedJobs: number;
  views: number;
}

// ─── Salary ──────────────────────────────────────────────────────────────────

export interface SalaryData {
  role: string;
  min: number;
  max: number;
  average: number;
  currency: string;
  country: string;
  industry: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  recommended?: boolean;
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface PageParams {
  params: { id: string };
}

export interface CompanyParams {
  params: { company: string };
}

export interface WithChildren {
  children: ReactNode;
}

export interface WithClassName {
  className?: string;
}
