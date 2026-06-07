import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Easing } from 'react-native';
import { colors } from '../theme/theme';

const { width: W, height: H } = Dimensions.get('window');
const PALETTE = [colors.green, colors.blue, colors.amber, colors.pink, colors.purple, colors.orange];
const COUNT = 80;

function Piece({ delay }) {
  const y = useRef(new Animated.Value(-20)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const left = useRef(Math.random() * W).current;
  const size = useRef(6 + Math.random() * 8).current;
  const color = useRef(PALETTE[Math.floor(Math.random() * PALETTE.length)]).current;
  const round = useRef(Math.random() > 0.5).current;
  const duration = useRef(1800 + Math.random() * 1600).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: H + 40, duration, delay, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(rot, { toValue: 4, duration, delay, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration, delay, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  const spin = rot.interpolate({ inputRange: [0, 4], outputRange: ['0deg', '1440deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: round ? size / 2 : 2,
        opacity,
        transform: [{ translateY: y }, { rotate: spin }],
      }}
    />
  );
}

export default function Confetti({ show }) {
  if (!show) return null;
  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: COUNT }).map((_, i) => (
        <Piece key={i} delay={i * 25} />
      ))}
    </Animated.View>
  );
}
