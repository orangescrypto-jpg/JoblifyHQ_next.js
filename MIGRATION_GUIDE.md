# Joblify — Backend Migration Guide

## Architecture Overview

Your app now uses a service layer that sits between your components and Firebase:

```
Components / Contexts
        ↓
  src/services/          ← import from here ONLY
        ↓
  src/services/providers/firebase/  ← only place Firebase lives
        ↓
    Firebase
```

## Services

| File | What it handles |
|------|----------------|
| `src/services/jobs.ts` | Job listings, boost, referrals |
| `src/services/scholarships.ts` | Scholarships, boost |
| `src/services/blog.ts` | Blog posts |
| `src/services/auth.ts` | Auth, user profiles, roles |
| `src/services/dashboard.ts` | Saved items, applications |

## How to Use in New Code

```ts
// ✅ Correct — always import from src/services
import { JobsService } from '@/src/services'
import { AuthService } from '@/src/services'

// ❌ Wrong — never import firebase directly in components
import { collection } from 'firebase/firestore'
```

## How to Migrate Away from Firebase (Future)

When you're ready to switch to e.g. Supabase:

1. Create `src/services/providers/supabase/jobs.ts` with the same method signatures
2. In `src/services/jobs.ts`, change ONE line:
   ```ts
   // Before:
   export { JobsService } from '@/src/services/providers/firebase/jobs'
   // After:
   export { JobsService } from '@/src/services/providers/supabase/jobs'
   ```
3. Repeat for each service. Pages and components need ZERO changes.

## Files Still Using Firebase Directly (Existing — migrate gradually)

- `services/firebase/jobs.ts` (old — can be deleted when done)
- `services/firebase/blog.ts` (old — can be deleted when done)
- `services/firebase/scholarships.ts` (old — can be deleted when done)
- `services/blog.ts` (duplicate — can be deleted when done)
- `services/serverFetchers.ts` (migrate when ready)
- Various page components — migrate when you touch them
