// Auth + cloud-sync state for the whole app.
// - Works fully offline as a "guest" (no account).
// - On sign-in, pulls the cloud snapshot and merges with local, then keeps
//   pushing local changes up.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

import { api } from '../lib/api';
import { storage } from '../lib/storage';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = guest
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const extra = Constants.expoConfig?.extra || {};

  // Google OAuth hook (returns a request + a response we watch).
  const [, googleResponse, googlePrompt] = Google.useAuthRequest({
    webClientId: extra.googleWebClientId,
    iosClientId: extra.googleIosClientId,
    androidClientId: extra.googleAndroidClientId,
  });

  // Restore session on launch.
  useEffect(() => {
    (async () => {
      try {
        const token = await storage.getToken();
        const savedUser = await storage.getUser();
        if (token && savedUser) {
          setUser(savedUser);
          // Refresh in background; ignore failures (offline).
          api.me().then((u) => { setUser(u.user); storage.setUser(u.user); }).catch(() => {});
          await pullAndMerge();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle Google response.
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken || googleResponse.params?.id_token;
      if (idToken) finishOAuth(() => api.oauthGoogle(idToken));
    }
  }, [googleResponse]);

  async function persistSession(res) {
    await storage.setToken(res.token);
    await storage.setUser(res.user);
    setUser(res.user);
    await pullAndMerge();
  }

  async function finishOAuth(call) {
    setError(null);
    try {
      const res = await call();
      await persistSession(res);
    } catch (e) {
      setError(e.message);
    }
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
    await googlePrompt();
  }, [googlePrompt]);

  const continueAsGuest = useCallback(async () => {
    // Guest = no token, no user. App runs purely on local storage.
    setUser(null);
    await storage.clearAuth();
  }, []);

  const logout = useCallback(async () => {
    await storage.clearAuth();
    setUser(null);
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
