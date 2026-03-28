import { useEffect } from 'react';
import { api } from '@/services/api/index.js';

/**
 * One browser notification per day when coach nudges are on,
 * permissions are granted, and a warning-level insight exists.
 */
export function useCoachInsightsNudge(userId) {
  useEffect(() => {
    if (!userId) return;
    if (localStorage.getItem('flexflow_coach_notify') !== '1') return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    const today = new Date().toDateString();
    if (localStorage.getItem('flexflow_coach_nudge_day') === today) return;

    let cancel = false;
    (async () => {
      try {
        const data = await api.insights(userId);
        if (cancel) return;
        const warn = data.insights?.find((i) => i.severity === 'warn');
        if (warn) {
          localStorage.setItem('flexflow_coach_nudge_day', today);
          new Notification('FlexFlow Coach', {
            body: warn.text.slice(0, 220),
            icon: '/favicon.svg',
          });
        }
      } catch {
        /* offline / API down */
      }
    })();
    return () => {
      cancel = true;
    };
  }, [userId]);
}
