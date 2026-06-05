# JoblifyHQ — Firestore Collections Reference

## New Collections Added

### `gigs`
Freelance gig listings posted by clients.
```
{
  title, description, category, skills[], budgetMin, budgetMax, currency,
  duration, country, isRemote, clientId, clientName, clientPhoto, clientVerified,
  status: 'open'|'in_progress'|'completed'|'cancelled'|'disputed'|'pending_review',
  proposalCount, isFeatured, deadline, assignedFreelancerId, assignedProposalId,
  createdAt, updatedAt
}
```

### `proposals`
Freelancer bids on gigs.
```
{
  gigId, freelancerId, freelancerName, freelancerPhoto, freelancerTier,
  coverLetter, bidAmount, currency, deliveryDays,
  status: 'pending'|'accepted'|'rejected'|'withdrawn',
  createdAt, updatedAt
}
```

### `escrow`
Payment escrow for freelance gigs.
```
{
  gigId, gigTitle, clientId, clientName, freelancerId, freelancerName,
  proposalId, amount, platformFeePercent, platformFee, freelancerAmount,
  currency, paymentMethod: 'bank_transfer'|'flutterwave'|'paystack',
  paymentReference, flwTransactionId,
  status: 'pending_funding'|'funded'|'in_progress'|'submitted'|'approved'|'released'|'disputed'|'refunded'|'cancelled',
  fundedAt, workSubmittedAt, approvedAt, releasedAt,
  disputeReason, disputedAt, resolvedAt, resolvedBy,
  createdAt, updatedAt
}
```

### `disputes`
Raised when client or freelancer disputes escrow outcome.
```
{
  escrowId, gigId, gigTitle, clientId, clientName, freelancerId, freelancerName,
  raisedBy: 'client'|'freelancer', reason, evidence[],
  status: 'open'|'under_review'|'resolved_client'|'resolved_freelancer'|'escalated',
  assignedModerator, resolution, resolvedAt, createdAt
}
```

### `portfolio`
Freelancer portfolio items.
```
{ userId, title, description, imageUrl, projectUrl, category, tags[], createdAt }
```

### `skill_badges`
Skill verification requests and statuses.
```
{
  userId, skill, category,
  status: 'pending'|'verified'|'rejected',
  verifiedBy, verifiedAt, rejectionReason, evidence, createdAt
}
```

### `resumes`
One per user (doc ID = userId).
```
{
  userId, fullName, email, phone, location, summary,
  experience[{ id, company, role, startDate, endDate, current, description }],
  education[{ id, institution, degree, field, startYear, endYear, current }],
  skills[], certifications[{ id, name, issuer, year, url }], languages[],
  updatedAt
}
```

### `employer_kyc`
Employer verification applications.
```
{
  employerId, employerName, companyName, cacNumber, taxId, websiteUrl,
  documentUrl, country,
  status: 'pending'|'approved'|'rejected',
  reviewedBy, rejectionReason, createdAt, updatedAt
}
```

### `reports`
User-submitted reports on jobs, gigs, or users.
```
{
  reportedBy, reportedByName, targetId,
  targetType: 'job'|'gig'|'user'|'employer',
  type: 'spam'|'scam'|'inappropriate'|'fake_employer'|'harassment'|'other',
  description, status: 'open'|'under_review'|'resolved'|'dismissed',
  assignedTo, resolution, createdAt, updatedAt
}
```

### `moderator_logs`
Audit trail of moderator actions.
```
{ moderatorId, moderatorName, action, targetId, targetType, note, createdAt }
```

## Updated Collections

### `admin_config/payment_settings`
```
{
  bankName, accountName, accountNumber, bankCode,
  premiumMonthlyUSD, premiumAnnualUSD, employerGrowthUSD, employerScaleUSD,
  freelancerProUSD, boostUSD, featuredJobUSD, featuredGigUSD, scholarshipBoostUSD,
  escrowFeePercent, ngnPerUSD,
  flutterwaveEnabled, paystackEnabled, bankTransferEnabled,
  updatedAt
}
```

### `admin_config/platform_settings`
```
{
  siteName, siteTagline, maintenanceMode, allowNewRegistrations,
  requireJobApproval, requireGigApproval, escrowFeePercent, featuredJobDays,
  features: {
    freelanceEnabled, escrowEnabled, scholarshipsEnabled, blogEnabled,
    salaryPortalEnabled, skillBadgesEnabled, resumeBuilderEnabled,
    aiMatchingEnabled, servicesEnabled, kycEnabled, referralsEnabled
  },
  updatedAt, updatedBy
}
```

### `users`
Extended with:
```
{
  ...existing fields,
  role: 'user'|'freelancer'|'employer'|'moderator'|'admin',
  country, bio, phone, website, linkedin, twitter, skills[],
  isVerified, employerVerified, freelancerVerified,
  moderatorPermissions[],
  notifications: { emailJobAlerts, emailApplicationUpdates, emailGigUpdates, emailNewsletter, pushNotifications },
  privacySettings: { profileVisible, showEmail, showPhone }
}
```
