import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, normalizeBlock } from '@/services/api/index.js';
import { USER_STORAGE_KEY } from '@/domain/schedule/constants.js';
import { getStoredToken, setStoredToken } from '@/services/http/client.js';
import { useBlockNotifications } from '@/hooks/useNotifications.js';

const AppContext = createContext(null);

/** First-time schedule wizard: onboarding payload not saved yet */
export function needsScheduleSetup(user) {
  if (!user) return false;
  return !user.onboarding?.wakeTime;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));
  const [notificationsOn, setNotificationsOn] = useState(
    () => localStorage.getItem('flexflow_notif') === '1'
  );

  const loadBlocks = useCallback(async (id) => {
    if (!id) return;
    const raw = await api.getBlocks(id);
    setBlocks(raw.map(normalizeBlock));
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        if (!getStoredToken()) {
          if (!cancel) {
            setUser(null);
            setBlocks([]);
          }
          return;
        }
        const u = await api.me();
        if (cancel) return;
        setUser(u);
        await loadBlocks(u.id);
      } catch {
        if (!cancel) {
          setStoredToken(null);
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
          setBlocks([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [loadBlocks]);

  useBlockNotifications(blocks, user?.id, notificationsOn);

  const login = useCallback(
    async (identifier, password) => {
      const { token, user: u } = await api.login({ identifier, password });
      setStoredToken(token);
      setUser(u);
      await loadBlocks(u.id);
    },
    [loadBlocks]
  );

  const register = useCallback(
    async (payload) => {
      const { token, user: u } = await api.register(payload);
      setStoredToken(token);
      setUser(u);
      await loadBlocks(u.id);
    },
    [loadBlocks]
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setBlocks([]);
  }, []);

  const refreshGamification = useCallback(
    async (mutator) => {
      if (!user?.id) return;
      const nextG = mutator(user.gamification || {});
      const u = await api.patchUser(user.id, { gamification: nextG });
      setUser(u);
    },
    [user]
  );

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      logout();
    }
  }, [logout]);

  const value = useMemo(
    () => ({
      userId: user?.id ?? null,
      user,
      blocks,
      loading,
      notificationsOn,
      setNotificationsOn: (v) => {
        setNotificationsOn(v);
        localStorage.setItem('flexflow_notif', v ? '1' : '0');
      },
      login,
      register,
      logout,
      loadBlocks,
      setBlocks,
      setUser,
      refreshUser,
      refreshGamification,
    }),
    [
      user,
      blocks,
      loading,
      notificationsOn,
      login,
      register,
      logout,
      loadBlocks,
      refreshGamification,
      refreshUser,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp outside AppProvider');
  return ctx;
}
