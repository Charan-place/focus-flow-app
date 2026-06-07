# FocusFlow Mobile (Expo)

React Native app for iOS + Android.

## Run it (test on your phone in 2 minutes)

```bash
npm install
npm start
```

- Install **Expo Go** on your phone (App Store / Play Store).
- Scan the QR code shown in the terminal.
- The app opens. **Guest mode works immediately** — no backend, no sign-in needed.

> iOS simulator: `npm run ios` (needs Xcode). Android emulator: `npm run android`.

## Connecting to the backend

By default the app points at `http://localhost:4000` (see `app.json` → `extra.apiUrl`).

- On a **simulator** on the same Mac, `localhost` works.
- On a **physical phone**, `localhost` is the phone, not your Mac. Use your Mac's LAN IP,
  e.g. `http://192.168.1.20:4000`. Find it: `ipconfig getifaddr en0`. Update
  `app.json` → `extra.apiUrl`, then restart `npm start`.
- Once deployed (Render/Railway), set `apiUrl` to the public URL.

## OAuth setup (Google + Apple)

Guest + email/password work without this. For social sign-in:

### Google
1. Google Cloud Console → **APIs & Services → Credentials**.
2. Create **OAuth client IDs**: one **Web**, one **iOS**, one **Android**.
   - Web client id also goes in the **server** `.env` as `GOOGLE_WEB_CLIENT_ID`.
3. Put the three IDs in `app.json` → `extra`:
   `googleWebClientId`, `googleIosClientId`, `googleAndroidClientId`.

### Apple (iOS only)
1. Requires an **Apple Developer** account ($99/yr).
2. Enable **Sign in with Apple** for the App ID `com.charan.focusflow`.
3. `usesAppleSignIn: true` is already set in `app.json`.
4. The server verifies the identity token against `APPLE_BUNDLE_ID`.

Apple Sign In only appears on real iOS devices/builds, not Android or Expo Go on Android.

## Project structure

```
src/
├── theme/theme.js          # colors, design tokens
├── lib/
│   ├── storage.js          # AsyncStorage (local persistence)
│   ├── api.js              # backend client
│   └── feedback.js         # sound, speech, haptics, notifications
├── context/
│   ├── AuthContext.js      # auth + sync state
│   └── FocusContext.js     # the timer engine + tasks + stats
├── components/
│   ├── TimerRing.js
│   ├── Confetti.js
│   └── CelebrationModal.js
└── screens/
    ├── AuthScreen.js
    ├── HomeScreen.js
    ├── StatsScreen.js
    └── SettingsScreen.js
```

## Notes on the timer

The countdown is **wall-clock based** (`FocusContext` stores a target timestamp and
derives seconds-left from `Date.now()`), so it stays accurate when the app is backgrounded
and recomputes on resume. For true background completion alerts while the app is killed,
schedule a local notification at the target time — a good next enhancement.

## Building for stores (later)

Use EAS Build:
```bash
npm install -g eas-cli
eas build --platform android   # or ios
```
Android: Google Play ($25 one-time). iOS: App Store ($99/yr, needs Apple Developer).
