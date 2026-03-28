import { useCallback, useEffect, useRef } from 'react';

export function useNotifications() {
  const permissionRef = useRef(typeof Notification !== 'undefined' ? Notification.permission : 'denied');

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    const p = await Notification.requestPermission();
    permissionRef.current = p;
    return p === 'granted';
  }, []);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const scheduleBlockReminder = useCallback(
    (label, fireAtMs, onFire) => {
      const delay = fireAtMs - Date.now();
      if (delay <= 0) return () => {};
      const t = setTimeout(() => {
        onFire?.();
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('FlexFlow', { body: label, icon: '/favicon.svg' });
        }
      }, delay);
      return () => clearTimeout(t);
    },
    []
  );

  return { permission: permissionRef.current, requestPermission, scheduleBlockReminder };
}

/**
 * Poll today's blocks and fire notifications when a block starts soon
 */
export function useBlockNotifications(blocks, userId, enabled) {
  const fired = useRef(new Set());

  useEffect(() => {
    if (!enabled || !userId || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    const iv = setInterval(() => {
      const now = new Date();
      const day = (now.getDay() + 6) % 7;
      const minsMidnight = now.getHours() * 60 + now.getMinutes();
      const five = 5 * 60;
      let gridM = minsMidnight >= five ? minsMidnight - five : minsMidnight + 24 * 60 - five;

      const soon = blocks.filter(
        (b) =>
          b.day === day &&
          b.reminderEnabled &&
          b.startMinutes > gridM &&
          b.startMinutes <= gridM + 10
      );
      for (const b of soon) {
        const key = `${b.id}-${Math.floor(now.getTime() / 600000)}`;
        if (fired.current.has(key)) continue;
        fired.current.add(key);
        new Notification('Starting soon', {
          body: `${b.title || b.type} at ${formatGrid(b.startMinutes)}`,
          icon: '/favicon.svg',
        });
      }
    }, 30000);

    return () => clearInterval(iv);
  }, [blocks, enabled, userId]);
}

function formatGrid(startMinutes) {
  const five = 5 * 60;
  let abs = five + startMinutes;
  while (abs >= 24 * 60) abs -= 24 * 60;
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
