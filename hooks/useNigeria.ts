// hooks/useNigeria.ts
// ─── Nigeria Detection Hook ───────────────────────────────────────────────────
// Uses the browser's Intl timezone API — no external API call needed.
// Nigerian timezones: Africa/Lagos (WAT, UTC+1)
//
// Returns { isNigeria: boolean, loading: boolean }
// Falls back to `false` (non-Nigeria) if detection fails.

import { useState, useEffect } from 'react';

export function useNigeria() {
  const [isNigeria, setIsNigeria] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Nigerian timezones use Africa/Lagos
      const detected = tz === 'Africa/Lagos';
      setIsNigeria(detected);
    } catch {
      // Safe default: non-Nigeria → show Flutterwave
      setIsNigeria(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { isNigeria, loading };
}
