// FocusContext — the timer engine + tasks + stats + settings.
// This is the mobile replacement for the extension's service-worker.js.
// Uses a wall-clock-based countdown (resilient to JS timer drift and to the
// app being backgrounded: we compute remaining time from a target timestamp).

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';

import { storage, DEFAULT_SETTINGS, DEFAULT_STATS } from '../lib/storage';
import { playSound, speak, haptic, notify } from '../lib/feedback';
import { useAuth } from './AuthContext';

const FocusContext = createContext(null);
export const useFocus = () => useContext(FocusContext);

const MODES = ['focus', 'shortBreak', 'longBreak'];

export function FocusProvider({ children }) {
  const { pushSnapshot } = useAuth() || {};
  useKeepAwake(); // keep screen on while the app is foregrounded

  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [tasks, setTasksState] = useState([]);
  const [stats, setStatsState] = useState(DEFAULT_STATS);

  const [mode, setMode] = useState('focus');
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SETTINGS.focusDuration * 60);
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_SETTINGS.focusDuration * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [celebration, setCelebration] = useState(null); // {type,title,body,pomodoroCount}

  const targetRef = useRef(null); // epoch ms when current phase ends
  const tickRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // ── Load persisted data on mount ──
  useEffect(() => {
    (async () => {
      const [s, t, st] = await Promise.all([
        storage.getSettings(),
        storage.getTasks(),
        storage.getStats(),
      ]);
      setSettingsState(s);
      setTasksState(t);
      setStatsState(st);
      setSecondsLeft(s.focusDuration * 60);
      setTotalSeconds(s.focusDuration * 60);
    })();
  }, []);

  // ── Recompute remaining when app returns to foreground ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && running && targetRef.current) {
        const left = Math.max(0, Math.round((targetRef.current - Date.now()) / 1000));
        setSecondsLeft(left);
        if (left <= 0) handleComplete();
      }
    });
    return () => sub.remove();
  }, [running]);

  // ── Tick loop ──
  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        const left = Math.max(0, Math.round((targetRef.current - Date.now()) / 1000));
        setSecondsLeft(left);
        if (left <= 0) handleComplete();
      }, 250);
    }
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // ── Persistence helpers ──
  const persistSettings = useCallback(async (next) => {
    setSettingsState(next);
    await storage.setSettings(next);
    pushSnapshot?.();
  }, [pushSnapshot]);

  const persistTasks = useCallback(async (next) => {
    setTasksState(next);
    await storage.setTasks(next);
    pushSnapshot?.();
  }, [pushSnapshot]);

  const persistStats = useCallback(async (next) => {
    setStatsState(next);
    await storage.setStats(next);
    pushSnapshot?.();
  }, [pushSnapshot]);

  function durationFor(m, cfg = settingsRef.current) {
    if (m === 'shortBreak') return cfg.shortBreak;
    if (m === 'longBreak') return cfg.longBreak;
    return cfg.focusDuration;
  }

  // ── Controls ──
  const start = useCallback((m = mode, taskId = activeTaskId) => {
    const cfg = settingsRef.current;
    const dur = durationFor(m, cfg) * 60;
    targetRef.current = Date.now() + dur * 1000;
    setMode(m);
    setTotalSeconds(dur);
    setSecondsLeft(dur);
    setActiveTaskId(taskId);
    setRunning(true);
    haptic('light');
  }, [mode, activeTaskId]);

  const resume = useCallback(() => {
    if (secondsLeft <= 0) return;
    targetRef.current = Date.now() + secondsLeft * 1000;
    setRunning(true);
  }, [secondsLeft]);

  const pause = useCallback(() => {
    setRunning(false);
    clearInterval(tickRef.current);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    clearInterval(tickRef.current);
    const dur = durationFor('focus') * 60;
    setMode('focus');
    setSecondsLeft(dur);
    setTotalSeconds(dur);
    targetRef.current = null;
  }, []);

  const switchMode = useCallback((m) => {
    setRunning(false);
    clearInterval(tickRef.current);
    const dur = durationFor(m) * 60;
    setMode(m);
    setSecondsLeft(dur);
    setTotalSeconds(dur);
    targetRef.current = null;
  }, []);

  const skip = useCallback(() => handleComplete(), []); // eslint-disable-line

  // ── Phase completion ──
  async function handleComplete() {
    clearInterval(tickRef.current);
    setRunning(false);
    const cfg = settingsRef.current;

    if (mode === 'focus') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      await bumpStats(cfg);

      const isLong = newCount % cfg.longBreakAfter === 0;
      const next = isLong ? 'longBreak' : 'shortBreak';
      await fireCelebration('focusComplete', { pomodoroCount: newCount }, cfg);

      if (cfg.autoStartBreaks) start(next, activeTaskId);
      else switchMode(next);
    } else {
      await fireCelebration('breakComplete', {}, cfg);
      if (cfg.autoStartFocus) start('focus', activeTaskId);
      else switchMode('focus');
    }
  }

  async function fireCelebration(type, extra, cfg) {
    let title, body, tts, sound;
    if (type === 'focusComplete') {
      const c = extra.pomodoroCount;
      sound = 'focusComplete';
      title = '🔥 Focus Session Complete!';
      body = c % cfg.longBreakAfter === 0
        ? `Incredible! ${c} pomodoros done. Time for a long break.`
        : `Pomodoro #${c} crushed! Take a short break.`;
      tts = `Focus session complete. Pomodoro number ${c} done. Take a break.`;
    } else if (type === 'breakComplete') {
      sound = 'breakComplete';
      title = '⚡ Break Over — Time to Focus!';
      body = 'Your mind is refreshed. Lock in. One task. Full power.';
      tts = 'Break time is over. Get back in the zone. One task, full focus.';
    } else if (type === 'taskComplete') {
      sound = 'victory';
      title = '✅ Task Conquered!';
      body = `"${extra.taskName}" — DONE.`;
      tts = `Task complete. ${extra.taskName}. Crushed it.`;
    }

    if (cfg.soundEnabled && sound) playSound(sound, cfg.soundVolume);
    if (cfg.ttsEnabled && tts) speak(tts, { rate: cfg.ttsRate, pitch: cfg.ttsPitch });
    if (cfg.hapticsEnabled) haptic('success');
    if (cfg.notificationsEnabled) notify(title, body);
    setCelebration({ type, title, body, pomodoroCount: extra.pomodoroCount });
  }

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  // ── Stats ──
  async function bumpStats(cfg) {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const wasYesterday = stats.lastActiveDate === yesterday;
    const isToday = stats.lastActiveDate === today;

    let streak = stats.currentStreak || 0;
    if (!isToday && !wasYesterday) streak = 1;
    else if (!isToday) streak += 1;

    const history = [...(stats.dailyHistory || [])];
    const existing = history.find((d) => d.date === today);
    if (existing) {
      existing.pomodoros += 1;
      existing.minutes += cfg.focusDuration;
    } else {
      history.push({ date: today, pomodoros: 1, minutes: cfg.focusDuration });
      if (history.length > 30) history.shift();
    }

    await persistStats({
      ...stats,
      totalPomodoros: (stats.totalPomodoros || 0) + 1,
      totalFocusMinutes: (stats.totalFocusMinutes || 0) + cfg.focusDuration,
      currentStreak: streak,
      longestStreak: Math.max(stats.longestStreak || 0, streak),
      lastActiveDate: today,
      dailyHistory: history,
    });
  }

  // ── Task actions ──
  const addTask = useCallback(async (text) => {
    const t = { id: `task_${Date.now()}`, text, completed: false, createdAt: Date.now() };
    const next = [t, ...tasks];
    await persistTasks(next);
    if (!activeTaskId) setActiveTaskId(t.id);
    return t;
  }, [tasks, activeTaskId, persistTasks]);

  const setActive = useCallback((id) => {
    setActiveTaskId(id);
    const t = tasks.find((x) => x.id === id);
    if (t && settingsRef.current.ttsEnabled) speak(`Locked in on: ${t.text}. Let's go.`, {});
    haptic('light');
  }, [tasks]);

  const completeTask = useCallback(async (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.completed) return;
    const next = tasks.map((x) => (x.id === id ? { ...x, completed: true, completedAt: Date.now() } : x));
    await persistTasks(next);
    await persistStats({ ...stats, tasksCompleted: (stats.tasksCompleted || 0) + 1, lastActiveDate: new Date().toDateString() });
    if (activeTaskId === id) {
      setActiveTaskId(null);
      await fireCelebration('taskComplete', { taskName: t.text }, settingsRef.current);
      const nextTask = next.find((x) => !x.completed);
      if (nextTask) setTimeout(() => setActiveTaskId(nextTask.id), 600);
    }
  }, [tasks, stats, activeTaskId, persistTasks, persistStats]);

  const deleteTask = useCallback(async (id) => {
    const next = tasks.filter((x) => x.id !== id);
    await persistTasks(next);
    if (activeTaskId === id) setActiveTaskId(null);
  }, [tasks, activeTaskId, persistTasks]);

  const resetStats = useCallback(async () => {
    await persistStats(DEFAULT_STATS);
    setPomodoroCount(0);
  }, [persistStats]);

  const activeTask = tasks.find((t) => t.id === activeTaskId && !t.completed) || null;

  return (
    <FocusContext.Provider
      value={{
        settings, tasks, stats,
        mode, running, secondsLeft, totalSeconds, pomodoroCount, activeTask, activeTaskId,
        celebration, dismissCelebration,
        start, resume, pause, reset, switchMode, skip,
        addTask, setActive, completeTask, deleteTask,
        updateSettings: persistSettings, resetStats,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}
