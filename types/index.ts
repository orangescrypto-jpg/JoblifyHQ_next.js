import type { ReactNode } from 'react';

// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'freelancer' | 'employer' | 'moderator' | 'admin';
export type UserTier =
  | 'free' | 'premium' | 'premium-annual'
  | 'employer-free' | 'employer-pro' | 'employer-enterprise'
  | 'employer-growth' | 'employer-scale'
  | 'freelancer-free' | 'freelancer-pro';

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
  freelancerTier?: string;
  /** ISO country name e.g. "Nigeria", "Ghana". Stored at registration & editable in settings. */
  country?: string;
  // Profile extras
  bio?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  skills?: string[];
  // Verification
  isVerified?: boolean;
  employerVerified?: boolean;
  freelancerVerified?: boolean;
  // Moderator permissions
  moderatorPermissions?: ModeratorPermission[];
  // Premium
  premiumExpiresAt?: unknown;
  premiumPlan?: string;
  // Settings
  notifications?: UserNotificationSettings;
  privacySettings?: UserPrivacySettings;
  /** Freelancer payout details — Nigerian users: bank only. Others: PayPal / crypto. */
  payoutDetails?: FreelancerPayoutDetails;
}

export interface UserNotificationSettings {
  emailJobAlerts: boolean;
  emailApplicationUpdates: boolean;
  emailGigUpdates: boolean;
  emailNewsletter: boolean;
  pushNotifications: boolean;
}

export interface UserPrivacySettings {
  profileVisible: boolean;
  showEmail: boolean;
  showPhone: boolean;
}

// ─── Freelancer Payout Details ────────────────────────────────────────────────
// Nigerian freelancers fill bankName/accountName/accountNumber.
// International freelancers fill paypalEmail and/or cryptoAddress + cryptoNetwork.

export type CryptoNetwork = 'ethereum' | 'bnb';

export interface FreelancerPayoutDetails {
  // Nigerian bank transfer
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  // International — PayPal
  paypalEmail?: string;
  // International — Crypto (USDT / USDC)
  cryptoAddress?: string;
  cryptoNetwork?: CryptoNetwork; // 'ethereum' | 'bnb'
  updatedAt?: unknown;
}

// ─── Withdrawal Request ───────────────────────────────────────────────────────
// Freelancers request a payout. Admin sees it, pays, and marks as paid.

export type WithdrawalStatus = 'pending' | 'processing' | 'paid' | 'rejected';
export type WithdrawalMethod = 'bank_transfer' | 'paypal' | 'crypto_usdt' | 'crypto_usdc';

export interface WithdrawalRequest {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerEmail: string;
  freelancerCountry: string;
  amountUSD: number;
  /** NGN equivalent — only relevant for Nigerian users */
  amountNGN?: number;
  method: WithdrawalMethod;
  // Snapshot of payout details at request time
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  paypalEmail?: string;
  cryptoAddress?: string;
  cryptoNetwork?: CryptoNetwork;
  status: WithdrawalStatus;
  adminNote?: string;
  rejectionReason?: string;
  requestedAt: unknown;
  processedAt?: unknown;
  processedBy?: string;
}

// ─── Moderator ───────────────────────────────────────────────────────────────

export type ModeratorPermission =
  | 'review_jobs'
  | 'review_gigs'
  | 'review_employers'
  | 'manage_reports'
  | 'manage_disputes'
  | 'review_kyc'
  | 'manage_blog'
  | 'manage_scholarships'
  | 'ban_users';

export interface ModeratorLog {
  id: string;
  moderatorId: string;
  moderatorName: string;
  action: string;
  targetId: string;
  targetType: 'job' | 'gig' | 'user' | 'report' | 'dispute' | 'employer';
  note?: string;
  createdAt: unknown;
}

// ─── Job ─────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  country?: string;
  city?: string;
  type: string;
  category?: string;
  experienceLevel?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
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
  status: 'active' | 'closed' | 'draft' | 'pending_review';
  employerId?: string;
  applicationCount?: number;
  views?: number;
  externalUrl?: string;
  org?: string;
  reviewedBy?: string;
  reviewedAt?: unknown;
  rejectionReason?: string;
}

// ─── Freelance Gig ────────────────────────────────────────────────────────────

export type GigStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'pending_review';
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetMin: number;
  budgetMax: number;
  currency: string;
  duration: string;
  country: string;
  isRemote: boolean;
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  clientVerified?: boolean;
  status: GigStatus;
  proposalCount?: number;
  isFeatured?: boolean;
  attachments?: string[];
  createdAt: unknown;
  updatedAt: unknown;
  deadline?: string;
  assignedFreelancerId?: string;
  assignedProposalId?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface Proposal {
  id: string;
  gigId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerPhoto?: string;
  freelancerTier?: string;
  coverLetter: string;
  bidAmount: number;
  currency: string;
  deliveryDays: number;
  status: ProposalStatus;
  createdAt: unknown;
  updatedAt?: unknown;
}

// ─── Escrow ──────────────────────────────────────────────────────────────────

export type EscrowStatus =
  | 'pending_funding'
  | 'funded'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'released'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export interface EscrowTransaction {
  id: string;
  gigId: string;
  gigTitle: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  proposalId: string;
  amount: number;
  platformFeePercent: number;
  platformFee: number;
  freelancerAmount: number;
  currency: string;
  status: EscrowStatus;
  paymentMethod: 'bank_transfer' | 'flutterwave' | 'crypto';
  paymentReference?: string;
  flwTransactionId?: string;
  fundedAt?: unknown;
  workSubmittedAt?: unknown;
  approvedAt?: unknown;
  releasedAt?: unknown;
  disputeReason?: string;
  disputedAt?: unknown;
  resolvedAt?: unknown;
  resolvedBy?: string;
  milestones?: EscrowMilestone[];
  createdAt: unknown;
  updatedAt: unknown;
}

export interface EscrowMilestone {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'submitted' | 'approved' | 'released';
  dueDate?: string;
  submittedAt?: unknown;
  approvedAt?: unknown;
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  category: string;
  tags?: string[];
  createdAt: unknown;
}

// ─── Skill Verification ───────────────────────────────────────────────────────

export type SkillBadgeStatus = 'pending' | 'verified' | 'rejected';

export interface SkillBadge {
  id: string;
  userId: string;
  skill: string;
  category: string;
  status: SkillBadgeStatus;
  verifiedBy?: string;
  verifiedAt?: unknown;
  rejectionReason?: string;
  evidence?: string;
  createdAt: unknown;
}

// ─── Resume ──────────────────────────────────────────────────────────────────

export interface Resume {
  id?: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  certifications?: ResumeCertification[];
  languages?: string[];
  updatedAt?: unknown;
}

export interface ResumeExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear?: string;
  current: boolean;
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuer: string;
  year: string;
  url?: string;
}

// ─── Scholarship ──────────────────────────────────────────────────────────────

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
  level?: string;
  status: 'active' | 'closed';
  externalUrl?: string;
  org?: string;
  location?: string;
  type?: string;
  isFeatured?: boolean;
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

// ─── Application ──────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'Submitted' | 'Under Review' | 'Under review'
  | 'Shortlisted' | 'Rejected' | 'Accepted'
  | 'Interview' | 'Viewed' | 'Contacted' | 'New';
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
  type: 'job' | 'scholarship' | 'gig';
  jobId?: string;
  scholarshipId?: string;
  gigId?: string;
  itemData: Job | Scholarship | Gig;
  savedAt: unknown;
}

// ─── Report / Moderation ─────────────────────────────────────────────────────

export type ReportType = 'spam' | 'scam' | 'inappropriate' | 'fake_employer' | 'harassment' | 'other';
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reportedBy: string;
  reportedByName: string;
  targetId: string;
  targetType: 'job' | 'gig' | 'user' | 'employer';
  type: ReportType;
  description: string;
  status: ReportStatus;
  assignedTo?: string;
  resolution?: string;
  createdAt: unknown;
  updatedAt?: unknown;
}

// ─── Dispute ─────────────────────────────────────────────────────────────────

export type DisputeStatus = 'open' | 'under_review' | 'resolved_client' | 'resolved_freelancer' | 'escalated';

export interface Dispute {
  id: string;
  escrowId: string;
  gigId: string;
  gigTitle: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  raisedBy: 'client' | 'freelancer';
  reason: string;
  evidence?: string[];
  status: DisputeStatus;
  assignedModerator?: string;
  resolution?: string;
  resolvedAt?: unknown;
  createdAt: unknown;
}

// ─── KYC / Employer Verification ─────────────────────────────────────────────

export type KycStatus = 'pending' | 'approved' | 'rejected';

export interface EmployerKyc {
  id: string;
  employerId: string;
  employerName: string;
  companyName: string;
  cacNumber?: string;
  taxId?: string;
  websiteUrl?: string;
  documentUrl?: string;
  country: string;
  status: KycStatus;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: unknown;
  updatedAt?: unknown;
}

// ─── Platform Settings (Admin-controlled) ────────────────────────────────────

export interface PlatformFeatureFlags {
  freelanceEnabled: boolean;
  escrowEnabled: boolean;
  scholarshipsEnabled: boolean;
  blogEnabled: boolean;
  salaryPortalEnabled: boolean;
  skillBadgesEnabled: boolean;
  resumeBuilderEnabled: boolean;
  aiMatchingEnabled: boolean;
  servicesEnabled: boolean;
  kycEnabled: boolean;
  referralsEnabled: boolean;
}

export interface PlatformSettings {
  siteName: string;
  siteTagline: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  requireJobApproval: boolean;
  requireGigApproval: boolean;
  escrowFeePercent: number;
  featuredJobDays: number;
  features: PlatformFeatureFlags;
  updatedAt?: unknown;
  updatedBy?: string;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  recommended?: boolean;
}

export interface SalaryData {
  role: string;
  min: number;
  max: number;
  average: number;
  currency: string;
  country: string;
  industry: string;
}

export interface EmployerStats {
  activeJobs: number;
  totalApplications: number;
  promotedJobs: number;
  views: number;
}

// ─── Job Alert ────────────────────────────────────────────────────────────────

export interface JobAlert {
  id: string;
  userId: string;
  keywords: string;
  country?: string;
  type?: string;
  category?: string;
  isRemote?: boolean;
  createdAt: unknown;
}

// ─── Referral ────────────────────────────────────────────────────────────────

export interface Referral {
  id: string;
  referrerId: string;
  referredEmail: string;
  jobId?: string;
  status: 'pending' | 'signed_up' | 'rewarded';
  createdAt: unknown;
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface PageParams { params: { id: string } }
export interface CompanyParams { params: { company: string } }
export interface WithChildren { children: ReactNode }
export interface WithClassName { className?: string }
