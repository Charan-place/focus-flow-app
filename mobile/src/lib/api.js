// API client for the FocusFlow backend (Node/Express/MongoDB).
// All calls are best-effort: if the network or server is down, the app keeps
// working from local storage. Sync is layered on top, never required.

import Constants from 'expo-constants';
import { storage } from './storage';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:4000';

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await storage.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  url: API_URL,

  // ── Auth ──
  signup: (email, password) =>
    request('/auth/signup', { method: 'POST', body: { email, password }, auth: false }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  // OAuth: send the provider id-token / identity to the server, get our JWT back.
  oauthGoogle: (idToken) =>
    request('/auth/google', { method: 'POST', body: { idToken }, auth: false }),
  me: () => request('/auth/me'),

  // ── Data sync ──
  // Pull the full server snapshot for this user.
  pull: () => request('/sync'),
  // Push the local snapshot up (server merges / overwrites per timestamp).
  push: (snapshot) => request('/sync', { method: 'PUT', body: snapshot }),
};
