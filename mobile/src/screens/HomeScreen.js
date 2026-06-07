import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TimerRing from '../components/TimerRing';
import CelebrationModal from '../components/CelebrationModal';
import { useFocus } from '../context/FocusContext';
import { colors, mode as MODES } from '../theme/theme';

const MODE_KEYS = ['focus', 'shortBreak', 'longBreak'];
const MODE_LABELS = { focus: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break' };

export default function HomeScreen({ navigation }) {
  const f = useFocus();
  const [taskText, setTaskText] = useState('');

  const onAdd = async () => {
    const t = taskText.trim();
    if (!t) return;
    await f.addTask(t);
    setTaskText('');
  };

  const onStartPause = () => {
    if (f.running) f.pause();
    else if (f.secondsLeft < f.totalSeconds) f.resume();
    else f.start(f.mode, f.activeTaskId);
  };

  const pending = f.tasks.filter((t) => !t.completed);
  const done = f.tasks.filter((t) => t.completed);
  const ordered = [...pending, ...done];

  const Header = (
    <View>
      {/* top bar */}
      <View style={styles.topbar}>
        <View style={styles.logoRow}>
          <View style={styles.miniRing}><View style={styles.miniDot} /></View>
          <Text style={styles.brand}>FocusFlow</Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')}><Text style={styles.iconBtn}>◈</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}><Text style={styles.iconBtn}>⚙</Text></TouchableOpacity>
        </View>
      </View>

      {/* active task banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>LOCKED IN ON</Text>
        <Text style={styles.bannerTask} numberOfLines={1}>
          {f.activeTask ? f.activeTask.text : 'No active task — pick one below'}
        </Text>
      </View>

      {/* mode pills */}
      <View style={styles.pills}>
        {MODE_KEYS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.pill, f.mode === m && { backgroundColor: MODES[m].color + '22', borderColor: MODES[m].color }]}
            onPress={() => f.switchMode(m)}
          >
            <Text style={[styles.pillText, f.mode === m && { color: MODES[m].color }]}>{MODE_LABELS[m]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* timer */}
      <View style={styles.timerWrap}>
        <TimerRing secondsLeft={f.secondsLeft} totalSeconds={f.totalSeconds} mode={f.mode} />
      </View>

      {/* pomodoro dots */}
      <View style={styles.dots}>
        {Array.from({ length: f.settings.longBreakAfter }).map((_, i) => {
          const filled = (f.pomodoroCount % f.settings.longBreakAfter) > i;
          return <View key={i} style={[styles.dot, filled && { backgroundColor: colors.green }]} />;
        })}
      </View>

      {/* controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.ctrlSecondary} onPress={f.reset}><Text style={styles.ctrlIcon}>↺</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlPrimary, { backgroundColor: MODES[f.mode].color }]} onPress={onStartPause} activeOpacity={0.85}>
          <Text style={styles.ctrlPrimaryText}>
            {f.running ? '⏸  PAUSE' : f.secondsLeft < f.totalSeconds ? '▶  RESUME' : '▶  START'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlSecondary} onPress={f.skip}><Text style={styles.ctrlIcon}>⏭</Text></TouchableOpacity>
      </View>

      {/* tasks header + input */}
      <View style={styles.divider}><Text style={styles.dividerText}>TASKS</Text></View>
      <View style={styles.addRow}>
        <TextInput
          style={styles.taskInput}
          placeholder="Add a task and lock in..."
          placeholderTextColor={colors.textFaint}
          value={taskText}
          onChangeText={setTaskText}
          onSubmitEditing={onAdd}
          returnKeyType="done"
          maxLength={80}
        />
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <FlatList
        data={ordered}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={Header}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>Add a task to begin your focus session</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.taskItem, item.id === f.activeTaskId && { borderColor: colors.green }]}>
            <Pressable style={styles.check} onPress={() => f.completeTask(item.id)}>
              <Text style={styles.checkMark}>{item.completed ? '✓' : ''}</Text>
            </Pressable>
            <Text style={[styles.taskItemText, item.completed && styles.taskDone]} numberOfLines={2}>{item.text}</Text>
            {!item.completed && (
              <TouchableOpacity onPress={() => f.setActive(item.id)}>
                <Text style={[styles.focusBtn, item.id === f.activeTaskId && { color: colors.green }]}>
                  {item.id === f.activeTaskId ? '◎' : '▶'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => f.deleteTask(item.id)}><Text style={styles.delBtn}>✕</Text></TouchableOpacity>
          </View>
        )}
      />
      <CelebrationModal celebration={f.celebration} onDismiss={f.dismissCelebration} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniRing: { width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  miniDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  brand: { fontSize: 18, fontWeight: '800', color: colors.text },
  topActions: { flexDirection: 'row', gap: 18 },
  iconBtn: { fontSize: 20, color: colors.textDim },
  banner: { backgroundColor: colors.bg2, borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: colors.border },
  bannerLabel: { fontSize: 10, color: colors.textFaint, letterSpacing: 2, fontWeight: '700' },
  bannerTask: { fontSize: 16, color: colors.text, fontWeight: '700', marginTop: 4 },
  pills: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: { flex: 1, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.bg2 },
  pillText: { color: colors.textDim, fontSize: 12, fontWeight: '700' },
  timerWrap: { alignItems: 'center', marginVertical: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.bg3 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 8 },
  ctrlSecondary: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center' },
  ctrlIcon: { fontSize: 22, color: colors.textDim },
  ctrlPrimary: { paddingHorizontal: 34, paddingVertical: 16, borderRadius: 999 },
  ctrlPrimaryText: { color: '#0a0c0f', fontWeight: '800', fontSize: 16 },
  divider: { marginTop: 24, marginBottom: 12 },
  dividerText: { color: colors.textFaint, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  taskInput: { flex: 1, backgroundColor: colors.bg2, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 15 },
  addBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#0a0c0f', fontSize: 26, fontWeight: '800' },
  taskItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg2, borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: colors.border },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: colors.green, fontWeight: '800', fontSize: 14 },
  taskItemText: { flex: 1, color: colors.text, fontSize: 15 },
  taskDone: { textDecorationLine: 'line-through', color: colors.textFaint },
  focusBtn: { fontSize: 18, color: colors.textDim, paddingHorizontal: 4 },
  delBtn: { fontSize: 16, color: colors.textFaint, paddingHorizontal: 4 },
  empty: { alignItems: 'center', paddingVertical: 30 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: colors.textFaint, fontSize: 14 },
});
