import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocus } from '../context/FocusContext';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/theme';

const LIMITS = {
  focusDuration: [1, 90], shortBreak: [1, 30], longBreak: [5, 60], longBreakAfter: [2, 8],
};

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings, resetStats } = useFocus();
  const { user, isGuest, logout, syncing } = useAuth();

  const setNum = (key, delta) => {
    const [min, max] = LIMITS[key];
    const next = Math.min(max, Math.max(min, (settings[key] || min) + delta));
    updateSettings({ ...settings, [key]: next });
  };
  const setBool = (key, val) => updateSettings({ ...settings, [key]: val });

  const Num = ({ label, k }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.numRow}>
        <TouchableOpacity style={styles.numBtn} onPress={() => setNum(k, -1)}><Text style={styles.numBtnText}>−</Text></TouchableOpacity>
        <Text style={styles.numVal}>{settings[k]}</Text>
        <TouchableOpacity style={styles.numBtn} onPress={() => setNum(k, 1)}><Text style={styles.numBtnText}>+</Text></TouchableOpacity>
      </View>
    </View>
  );

  const Toggle = ({ label, k }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={!!settings[k]}
        onValueChange={(v) => setBool(k, v)}
        trackColor={{ true: colors.green, false: colors.bg3 }}
        thumbColor="#fff"
      />
    </View>
  );

  const confirmResetStats = () =>
    Alert.alert('Reset all stats?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetStats },
    ]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.head}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Account */}
        <Text style={styles.groupTitle}>👤 ACCOUNT</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <Text style={styles.label}>{isGuest ? 'Guest (local only)' : user?.email || 'Signed in'}</Text>
            {syncing && <Text style={styles.syncing}>syncing…</Text>}
          </View>
          {isGuest ? (
            <TouchableOpacity style={styles.signinBtn} onPress={() => navigation.navigate('Auth')}>
              <Text style={styles.signinText}>Sign in to sync across devices</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.row} onPress={logout}>
              <Text style={[styles.label, { color: colors.danger }]}>Log out</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.groupTitle}>⏱ TIMER DURATIONS</Text>
        <View style={styles.group}>
          <Num label="Focus (min)" k="focusDuration" />
          <Num label="Short Break (min)" k="shortBreak" />
          <Num label="Long Break (min)" k="longBreak" />
          <Num label="Long Break After" k="longBreakAfter" />
        </View>

        <Text style={styles.groupTitle}>🔔 ALERTS & FEEDBACK</Text>
        <View style={styles.group}>
          <Toggle label="Voice Alerts" k="ttsEnabled" />
          <Toggle label="Notifications" k="notificationsEnabled" />
          <Toggle label="Chime Sound" k="soundEnabled" />
          <Toggle label="Haptics" k="hapticsEnabled" />
        </View>

        <Text style={styles.groupTitle}>🚀 AUTOMATION</Text>
        <View style={styles.group}>
          <Toggle label="Auto-start Breaks" k="autoStartBreaks" />
          <Toggle label="Auto-start Focus" k="autoStartFocus" />
        </View>

        <TouchableOpacity style={styles.dangerBtn} onPress={confirmResetStats}>
          <Text style={styles.dangerText}>Reset All Stats</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  head: { marginBottom: 16 },
  back: { color: colors.blue, fontSize: 15, marginBottom: 8 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  groupTitle: { color: colors.textFaint, fontSize: 11, letterSpacing: 1.5, fontWeight: '700', marginTop: 22, marginBottom: 8 },
  group: { backgroundColor: colors.bg2, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { color: colors.text, fontSize: 15 },
  numRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  numBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center' },
  numBtnText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  numVal: { color: colors.text, fontSize: 16, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  syncing: { color: colors.blue, fontSize: 12 },
  signinBtn: { paddingVertical: 14 },
  signinText: { color: colors.green, fontWeight: '600', fontSize: 14 },
  dangerBtn: { marginTop: 28, backgroundColor: colors.danger + '22', borderWidth: 1, borderColor: colors.danger + '55', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  dangerText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});
