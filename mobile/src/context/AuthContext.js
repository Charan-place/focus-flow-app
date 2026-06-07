// Auth + cloud-sync state for the whole app.
// - Works fully offline as a "guest" (no account).
// - On sign-in, pulls the cloud snapshot and merges with local, then keeps
//   pushing local changes up.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Constants from 'expo-constants';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { api } from '../lib/api';
import { storage } from '../lib/storage';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = guest
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  // Has the user made a choice yet (signed in OR picked guest)?
  // Gates the app: false → show AuthScreen; true → show the app.
  const [hasEntered, setHasEntered] = useState(false);

  const extra = Constants.expoConfig?.extra || {};

  // Configure native Google sign-in once. webClientId is REQUIRED — it's what
  // makes Google return an idToken we can verify on our server.
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: extra.googleWebClientId,
      iosClientId: extra.googleIosClientId,
      offlineAccess: false,
    });
  }, []);

  // Restore session on launch.
  useEffect(() => {
    (async () => {
      try {
        const token = await storage.getToken();
        const savedUser = await storage.getUser();
        const guestChosen = await storage.getGuestFlag();
        if (token && savedUser) {
          setUser(savedUser);
          setHasEntered(true);
          // Refresh in background; ignore failures (offline).
          api.me().then((u) => { setUser(u.user); storage.setUser(u.user); }).catch(() => {});
          await pullAndMerge();
        } else if (guestChosen) {
          // Returning guest — skip the auth screen.
          setHasEntered(true);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persistSession(res) {
    await storage.setToken(res.token);
    await storage.setUser(res.user);
    await storage.setGuestFlag(false);
    setUser(res.user);
    setHasEntered(true); // route into the app
    await pullAndMerge();
  }

  // ── Public actions ──
  const signupEmail = useCallback(async (email, password) => {
    setError(null);
    const res = await api.signup(email, password);
    await persistSession(res);
  }, []);

  const loginEmail = useCallback(async (email, password) => {
    setError(null);
    const res = await api.login(email, password);
    await persistSession(res);
  }, []);

  const loginGoogle = useCallback(async () => {
    setError(null);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      // idToken location differs slightly across versions.
      const idToken = result?.data?.idToken || result?.idToken;
      if (!idToken) {
        setError('Google sign-in did not return a token.');
        return;
      }
      const res = await api.oauthGoogle(idToken);
      await persistSession(res);
    } catch (e) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return; // user backed out
      if (e.code === statusCodes.IN_PROGRESS) return;
      setError(e.message || 'Google sign-in failed');
    }
  }, []);

  const continueAsGuest = useCallback(async () => {
    // Guest = no token, no user. App runs purely on local storage.
    setUser(null);
    await storage.clearAuth();
    await storage.setGuestFlag(true);
    setHasEntered(true); // route into the app
  }, []);

  const logout = useCallback(async () => {
    await storage.clearAuth();
    await storage.setGuestFlag(false);
    setUser(null);
    setHasEntered(false); // back to the auth screen
  }, []);

  // ── Sync ──
  async function pullAndMerge() {
    if (!(await storage.getToken())) return;
    setSyncing(true);
    try {
      const remote = await api.pull(); // { settings, tasks, stats, updatedAt }
      const [lSettings, lTasks, lStats] = await Promise.all([
        storage.getSettings(),
        storage.getTasks(),
        storage.getStats(),
      ]);
      // Simple last-write-wins by updatedAt; remote wins if newer or local empty.
      if (remote?.settings) await storage.setSettings({ ...lSettings, ...remote.settings });
      if (Array.isArray(remote?.tasks) && remote.tasks.length) await storage.setTasks(remote.tasks);
      if (remote?.stats) {
        // Keep the larger totals to avoid losing progress on merge.
        await storage.setStats({
          ...lStats,
          ...remote.stats,
          totalPomodoros: Math.max(lStats.totalPomodoros, remote.stats.totalPomodoros || 0),
          totalFocusMinutes: Math.max(lStats.totalFocusMinutes, remote.stats.totalFocusMinutes || 0),
          tasksCompleted: Math.max(lStats.tasksCompleted, remote.stats.tasksCompleted || 0),
          longestStreak: Math.max(lStats.longestStreak, remote.stats.longestStreak || 0),
        });
      }
    } catch {
      // offline / not signed in — ignore
    } finally {
      setSyncing(false);
    }
  }

  // Push current local snapshot to cloud (call after meaningful changes).
  const pushSnapshot = useCallback(async () => {
    if (!(await storage.getToken())) return;
    try {
      const [settings, tasks, stats] = await Promise.all([
        storage.getSettings(),
        storage.getTasks(),
        storage.getStats(),
      ]);
      await api.push({ settings, tasks, stats, updatedAt: Date.now() });
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest: !user,
        hasEntered,
        loading,
        syncing,
        error,
        signupEmail,
        loginEmail,
        loginGoogle,
        continueAsGuest,
        logout,
        pushSnapshot,
        pullAndMerge,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
