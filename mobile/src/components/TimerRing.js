import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, mode as MODES } from '../theme/theme';

const SIZE = 240;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export default function TimerRing({ secondsLeft, totalSeconds, mode }) {
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const offset = C * (1 - progress);
  const color = MODES[mode]?.color || colors.green;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={colors.bg3}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.face}>
        <Text style={styles.time}>{mins}:{secs}</Text>
        <Text style={[styles.label, { color }]}>{MODES[mode]?.label || 'FOCUS'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  face: { position: 'absolute', alignItems: 'center' },
  time: { fontSize: 54, fontWeight: '800', color: colors.text, letterSpacing: 1 },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 3, marginTop: 4 },
});
