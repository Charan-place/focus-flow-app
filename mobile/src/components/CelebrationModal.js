import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Confetti from './Confetti';
import { colors } from '../theme/theme';

const ICONS = { focusComplete: '🔥', breakComplete: '⚡', taskComplete: '🏆' };
const ACCENT = { focusComplete: colors.green, breakComplete: colors.blue, taskComplete: colors.amber };

export default function CelebrationModal({ celebration, onDismiss }) {
  const visible = !!celebration;
  const type = celebration?.type;
  const accent = ACCENT[type] || colors.green;
  const showConfetti = type === 'focusComplete' || type === 'taskComplete';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Confetti show={showConfetti} />
        <View style={[styles.card, { borderColor: accent + '55' }]}>
          <Text style={styles.icon}>{ICONS[type] || '⏰'}</Text>
          <Text style={[styles.title, { color: accent }]}>{celebration?.title}</Text>
          <Text style={styles.body}>{celebration?.body}</Text>
          <TouchableOpacity style={styles.btn} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={styles.btnText}>Got it →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 360, backgroundColor: colors.bg2, borderRadius: 24,
    borderWidth: 1, padding: 32, alignItems: 'center',
  },
  icon: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 15, color: colors.textDim, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btn: { backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 999 },
  btnText: { color: colors.text, fontWeight: '700', fontSize: 14 },
});
