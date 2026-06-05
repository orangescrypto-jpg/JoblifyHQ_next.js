# JoblifyHQ — New Routes & Page Mapping

## Pages Folder (drop into your app/ router)

| File in /pages/       | Route in app/           | Who sees it |
|-----------------------|-------------------------|-------------|
| Gigs.tsx              | app/gigs/page.tsx       | All         |
| PostGig.tsx           | app/client/post-gig/page.tsx | Employers/Users |
| EscrowDetail.tsx      | app/escrow/[id]/page.tsx | Client/Freelancer |
| FreelancerDashboard.tsx| app/freelancer/dashboard/page.tsx | Freelancers |
| Portfolio.tsx         | app/freelancer/portfolio/page.tsx | Freelancers |
| ResumeBuilder.tsx     | app/resume-builder/page.tsx | All logged-in |
| UserSettings.tsx      | app/settings/page.tsx   | All logged-in |
| ModeratorDashboard.tsx| app/moderator/page.tsx  | Moderators  |
| AdminPlatformSettings.tsx | app/admin/platform/page.tsx | Admin |

## How to wire each page

Create a thin wrapper in the app/ directory:
```tsx
// app/gigs/page.tsx
export { default } from '@/pages/Gigs';
```

## Navigation additions needed

Add to your main navbar:
- Gigs → /gigs
- Post Gig → /client/post-gig (employers/clients)
- Freelancer Dashboard → /freelancer/dashboard (freelancers)
- Resume Builder → /resume-builder
- Settings → /settings

Add to admin panel sidebar:
- Platform Settings → /admin/platform

Add to moderator area:
- Moderator Panel → /moderator
