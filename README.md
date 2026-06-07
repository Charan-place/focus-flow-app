# ◎ FocusFlow — Mobile App

The mobile version of the [FocusFlow](https://github.com/Charan-place/focus-flow-extension)
Chrome extension. A privacy-first Pomodoro focus timer for **iOS and Android**, built with
React Native (Expo), with optional sign-in and cross-device cloud sync.

```
focus-flow-app/
├── mobile/    # Expo React Native app (iOS + Android)
└── server/    # Node + Express + MongoDB API (auth + sync)
```

## What it does

Same core as the extension — one task, focus/break cycles, completion chime + voice +
confetti, streaks and stats — re-implemented natively:

| Extension piece | Mobile equivalent |
|-----------------|-------------------|
| `chrome.storage.local` | AsyncStorage (local) + MongoDB (cloud when signed in) |
| `chrome.alarms` timer | Wall-clock countdown in `FocusContext` (survives backgrounding) |
| `chrome.tts` | `expo-speech` |
| `chrome.notifications` | `expo-notifications` |
| offscreen audio | `expo-av` |
| on-page confetti overlay | native `Confetti` + `CelebrationModal` |
| — (new) | haptics, sign-in, cross-device sync |

## Sign-in

- **Email + password**, **Google**, **Apple**, or **Guest** (no account).
- Guest data stays on-device. Sign in to sync settings, tasks, and stats across devices.

---

## Quick start

### 1. Backend (optional for guest-only testing)

```bash
cd server
npm install
cp .env.example .env       # then fill in MONGODB_URI + JWT_SECRET
npm run dev
```

You need a free **MongoDB Atlas** cluster — see [server/README.md](server/README.md).

### 2. Mobile app

```bash
cd mobile
npm install
npm start                  # opens Expo; scan the QR with Expo Go on your phone
```

The app works immediately as a **guest** with no backend. Sign-in/sync needs the server
running and OAuth credentials configured — see [mobile/README.md](mobile/README.md).

---

## Status

- ✅ Full app: timer, tasks, stats, settings, celebrations
- ✅ Guest mode (local-only) works with no setup
- ✅ Backend: email/Google/Apple auth + sync
- ⏳ OAuth credentials (Google/Apple) must be created by you — see mobile/README.md
- ⏳ Store release (Play / App Store) — test in Expo Go first

## Privacy

Same principle as the extension: guest mode sends nothing anywhere. When signed in, only
your tasks/settings/stats sync to your own backend + MongoDB. No analytics, no tracking.
