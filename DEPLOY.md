# Deployment Guide

Two parts: **(A) deploy the backend** so it's reachable from anywhere, then
**(B) build a shareable APK** your friends install directly.

```
Phone (APK) ──HTTPS──> Render (backend) ──> MongoDB Atlas
```

---

## A. Deploy backend to Render (free)

1. Go to https://render.com → sign up (use GitHub login).
2. **New → Blueprint** → connect your GitHub → pick `focus-flow-app`.
   - Render reads `server/render.yaml` automatically.
   - (Or: **New → Web Service**, root dir `server`, build `npm install`, start `npm start`.)
3. Before it deploys, add the secret **Environment Variables** (Dashboard → your
   service → Environment):
   - `MONGODB_URI` → your Atlas string (the new rotated one)
   - `JWT_SECRET` → your secret
   - `GOOGLE_WEB_CLIENT_ID` → your Web client id from Google Cloud Console (the value in `mobile/.env`)
4. Click **Deploy**. Wait ~2-3 min. You get a URL like:
   `https://focusflow-api.onrender.com`
5. Test it: open `https://YOUR-URL.onrender.com/health` in a browser → should show
   `{"ok":true}`.

> Free tier sleeps after 15 min idle. The first request after sleeping takes ~30s to
> wake. Fine for friends/testing.

**Atlas note:** Network Access must allow Render. Easiest: keep `0.0.0.0/0` (allow from
anywhere) in Atlas → Network Access.

---

## B. Build the shareable APK (free)

Once the backend URL is live:

1. Put the **real Render URL** into `mobile/eas.json` (both `preview` and `production`
   `env.API_URL`). (Ask the assistant to update it, or edit by hand.)
2. Install EAS CLI and log in (free Expo account):
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. From `mobile/`:
   ```bash
   cd mobile
   eas build:configure        # first time only; links the project
   eas build --platform android --profile preview
   ```
4. EAS builds in the cloud (~10-15 min). When done it prints a **download link** to the
   `.apk`.
5. Send that link to friends. On their Android phone: open link → download → tap the apk
   → "install from unknown sources" (Android will prompt) → done.

That APK is fully standalone — no Expo Go, no your-Mac needed. It talks to your Render
backend, which talks to MongoDB. Sign-in + sync work for everyone.

---

## C. Google sign-in in the APK

For Google to work in the built app, Google needs the build's signing fingerprint:

1. After the first EAS build, get the SHA-1:
   ```bash
   eas credentials        # Android → view the SHA-1 fingerprint
   ```
2. Google Cloud Console → Credentials → your **Android** OAuth client → add the package
   name `com.charan.focusflow` + that SHA-1.
3. Rebuild. Google sign-in now works. (Email + guest already work without this.)

---

## D. Later: put it on Google Play (so it shows in Google search)

When you want a real store listing + Google-searchable link:

1. Google Play Console → pay the **$25 one-time** fee.
2. Build an **app bundle** (not apk):
   ```bash
   eas build --platform android --profile production
   ```
3. Upload the `.aab` to Play Console, fill the listing (screenshots, description,
   privacy policy), submit. Review ~1-3 days.
4. Live link: `https://play.google.com/store/apps/details?id=com.charan.focusflow`
   — this is what appears in Google search and what you share with friends.

---

## Cost summary

| Item | Cost |
|------|------|
| MongoDB Atlas | Free |
| Render backend | Free (sleeps when idle) |
| EAS Build | Free tier |
| Shareable APK | Free |
| Google Play listing | $25 one-time (only when you want the store) |
| Apple App Store | $99/year (optional, iPhone) |
