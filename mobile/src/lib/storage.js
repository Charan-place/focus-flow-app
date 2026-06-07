// Local persistence — the mobile equivalent of chrome.storage.local.
// Everything works offline. When signed in, data also syncs to the cloud
// (see api.js + AuthContext), but local is always the source of truth on-device.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  settings: 'ff_settings',
  tasks: 'ff_tasks',
  stats: 'ff_stats',
  timerState: 'ff_timerState',
  token: 'ff_token',
  user: 'ff_user',
  guest: 'ff_guest',
};

export const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakAfter: 4,
  ttsEnabled: true,
  ttsRate: 0.95,
  ttsPitch: 1.0,
  notificationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.7,
  hapticsEnabled: true,
  autoStartBreaks: false,
  autoStartFocus: false,
};

export const DEFAULT_STATS = {
  totalPomodoros: 0,
  totalFocusMinutes: 0,
  tasksCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  dailyHistory: [],
};

async function getJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const storage = {
  getSettings: () => getJSON(KEYS.settings, DEFAULT_SETTINGS).then((s) => ({ ...DEFAULT_SETTINGS, ...s })),
  setSettings: (v) => setJSON(KEYS.settings, v),

  getTasks: () => getJSON(KEYS.tasks, []),
  setTasks: (v) => setJSON(KEYS.tasks, v),

  getStats: () => getJSON(KEYS.stats, DEFAULT_STATS).then((s) => ({ ...DEFAULT_STATS, ...s })),
  setStats: (v) => setJSON(KEYS.stats, v),

  getTimerState: () => getJSON(KEYS.timerState, null),
  setTimerState: (v) => setJSON(KEYS.timerState, v),

  getToken: () => AsyncStorage.getItem(KEYS.token),
  setToken: (v) => (v ? AsyncStorage.setItem(KEYS.token, v) : AsyncStorage.removeItem(KEYS.token)),

  getUser: () => getJSON(KEYS.user, null),
  setUser: (v) => (v ? setJSON(KEYS.user, v) : AsyncStorage.removeItem(KEYS.user)),

  getGuestFlag: () => getJSON(KEYS.guest, false),
  setGuestFlag: (v) => setJSON(KEYS.guest, !!v),

  clearAll: () => AsyncStorage.multiRemove(Object.values(KEYS)),
  clearAuth: () => AsyncStorage.multiRemove([KEYS.token, KEYS.user]),
};
