import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocus } from '../context/FocusContext';
import { colors } from '../theme/theme';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function last7(history) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const ds = d.toDateString();
    const found = (history || []).find((h) => h.date === ds);
    out.push({ label: i === 0 ? 'Today' : DAYS[d.getDay()], pomodoros: found?.pomodoros || 0 });
  }
  return out;
}

export default function StatsScreen({ navigation }) {
  const { stats } = useFocus();
  const days = last7(stats.dailyHistory);
  const max = Math.max(...days.map((d) => d.pomodoros), 1);

  const Card = ({ value, label, accent }) => (
    <View style={[styles.card, accent && { borderColor: colors.amber + '55' }]}>
      <Text style={[styles.cardValue, accent && { color: colors.amber }]}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.head}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
          <Text style={styles.title}>Your Progress</Text>
        </View>

        <View style={styles.grid}>
          <Card value={stats.totalPomodoros} label="Pomodoros" />
          <Card value={stats.totalFocusMinutes} label="Focus Minutes" />
          <Card value={stats.currentStreak} label="🔥 Day Streak" accent />
          <Card value={stats.tasksCompleted} label="Tasks Done" />
        </View>

        <Text style={styles.chartTitle}>Last 7 Days (Pomodoros)</Text>
        <View style={styles.chart}>
          {days.map((d, i) => (
            <View key={i} style={styles.barItem}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${(d.pomodoros / max) * 100}%`, backgroundColor: d.label === 'Today' ? colors.green : colors.bg3 }]} />
              </View>
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.longest}>
          <Text style={styles.longestText}>🏆 Longest Streak: {stats.longestStreak} days</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  head: { marginBottom: 20 },
  back: { color: colors.blue, fontSize: 15, marginBottom: 8 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: colors.bg2, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.border },
  cardValue: { color: colors.text, fontSize: 30, fontWeight: '800' },
  cardLabel: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  chartTitle: { color: colors.textDim, fontSize: 13, fontWeight: '700', marginTop: 28, marginBottom: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: 8 },
  barItem: { flex: 1, alignItems: 'center' },
  barTrack: { width: '100%', height: 130, backgroundColor: colors.bg2, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { color: colors.textFaint, fontSize: 11, marginTop: 6 },
  longest: { marginTop: 24, backgroundColor: colors.bg2, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  longestText: { color: colors.amber, fontWeight: '700', fontSize: 15 },
});
