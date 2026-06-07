// FocusFlow design tokens — mirrors the extension's dark industrial look.

export const colors = {
  bg: '#0a0c0f',
  bg2: '#111318',
  bg3: '#181c22',
  border: 'rgba(255,255,255,0.07)',
  text: '#ffffff',
  textDim: 'rgba(255,255,255,0.6)',
  textFaint: 'rgba(255,255,255,0.35)',

  green: '#4ade80',
  blue: '#60a5fa',
  amber: '#fbbf24',
  pink: '#f472b6',
  purple: '#a78bfa',
  orange: '#fb923c',
  danger: '#ef4444',
};

export const mode = {
  focus: { color: colors.green, label: 'FOCUS' },
  shortBreak: { color: colors.blue, label: 'SHORT BREAK' },
  longBreak: { color: colors.purple, label: 'LONG BREAK' },
};

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };
export const space = (n) => n * 4;
