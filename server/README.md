# FocusFlow Server

Node + Express + MongoDB API. Handles authentication (email/password, Google, Apple) and
cross-device sync of each user's settings/tasks/stats.

## Setup

### 1. MongoDB Atlas (free)

1. Create an account at https://www.mongodb.com/cloud/atlas and a free **M0** cluster.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere) for testing.
4. **Connect → Drivers** → copy the connection string. It looks like:
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/focusflow?retryWrites=true&w=majority`

### 2. Environment

```bash
cp .env.example .env
```

Fill in:
- `MONGODB_URI` — the Atlas string above (put `focusflow` as the db name).
- `JWT_SECRET` — generate one:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- `GOOGLE_WEB_CLIENT_ID` — from Google Cloud Console (see mobile/README.md). Needed only
  for Google sign-in.
- `APPLE_BUNDLE_ID` — `com.charan.focusflow` (your app's bundle id). Needed only for Apple
  sign-in.

### 3. Run

```bash
npm install
npm run dev      # auto-restarts on changes
# or: npm start
```

You should see `✅ MongoDB connected` and `✅ FocusFlow API on http://localhost:4000`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET  | `/health` | — | Liveness check |
| POST | `/auth/signup` | — | Email + password registration |
| POST | `/auth/login` | — | Email + password login |
| POST | `/auth/google` | — | Verify Google id token, return our JWT |
| POST | `/auth/apple` | — | Verify Apple identity token, return our JWT |
| GET  | `/auth/me` | Bearer | Current user profile |
| GET  | `/sync` | Bearer | Pull the user's snapshot |
| PUT  | `/sync` | Bearer | Push the user's snapshot (last-write-wins) |

## Deploy (when ready)

Free options: **Render**, **Railway**, **Fly.io**. Set the same env vars in the host's
dashboard. Then update `mobile/app.json` → `extra.apiUrl` to the deployed URL.

## Security notes

- Passwords hashed with bcrypt (cost 12). Plain passwords never stored.
- Google/Apple tokens are verified server-side against the provider's public keys.
- Our own session JWT is signed with `JWT_SECRET` and expires in 90 days.
- `.env` is gitignored — never commit secrets.
