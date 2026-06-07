import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/theme';

// Google OAuth can't work inside Expo Go (Google blocks its shared client).
// Only show the Google button in a real/dev build, not in Expo Go.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

export default function AuthScreen() {
  const { signupEmail, loginEmail, loginGoogle, continueAsGuest, error } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState(null);

  async function submitEmail() {
    setLocalErr(null);
    if (!email.trim() || password.length < 6) {
      setLocalErr('Enter an email and a password (6+ characters).');
      return;
    }
    setBusy(true);
    try {
      if (isSignup) await signupEmail(email.trim().toLowerCase(), password);
      else await loginEmail(email.trim().toLowerCase(), password);
    } catch (e) {
      setLocalErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <View style={styles.ring}><View style={styles.dot} /></View>
          <Text style={styles.brand}>FocusFlow</Text>
          <Text style={styles.tagline}>One task. Full focus.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {(localErr || error) && <Text style={styles.error}>{localErr || error}</Text>}

          <TouchableOpacity style={styles.primaryBtn} onPress={submitEmail} disabled={busy} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color="#0a0c0f" /> : (
              <Text style={styles.primaryBtnText}>{isSignup ? 'Create account' : 'Sign in'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignup((v) => !v)}>
            <Text style={styles.switchText}>
              {isSignup ? 'Have an account? Sign in' : "New here? Create an account"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}><Text style={styles.dividerText}>or</Text></View>

          {IS_EXPO_GO ? (
            <Text style={styles.note}>
              Google sign-in needs a dev build — use email or guest in Expo Go.
            </Text>
          ) : (
            <TouchableOpacity style={styles.oauthBtn} onPress={loginGoogle} activeOpacity={0.85}>
              <Text style={styles.oauthText}>Continue with Google</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.guestBtn} onPress={continueAsGuest} activeOpacity={0.7}>
            <Text style={styles.guestText}>Continue as guest</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.privacy}>
          Guest data stays on this device. Sign in to sync across devices.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: 28, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  ring: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 6, borderColor: colors.green,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  dot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.green },
  brand: { fontSize: 32, fontWeight: '800', color: colors.text },
  tagline: { fontSize: 14, color: colors.textDim, marginTop: 4 },
  form: { gap: 12 },
  input: {
    backgroundColor: colors.bg2, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 14, color: colors.text, fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  primaryBtn: { backgroundColor: colors.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#0a0c0f', fontWeight: '800', fontSize: 16 },
  switchText: { color: colors.blue, textAlign: 'center', marginTop: 6, fontSize: 14 },
  divider: { alignItems: 'center', marginVertical: 8 },
  dividerText: { color: colors.textFaint, fontSize: 13 },
  oauthBtn: { backgroundColor: colors.bg3, borderRadius: 12, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  oauthText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  note: { color: colors.textFaint, fontSize: 13, textAlign: 'center', paddingVertical: 8, lineHeight: 18 },
  guestBtn: { paddingVertical: 14, alignItems: 'center' },
  guestText: { color: colors.textDim, fontSize: 15, fontWeight: '600' },
  privacy: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 },
});
