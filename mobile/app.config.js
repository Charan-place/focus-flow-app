// Dynamic Expo config. Reads secrets/ids from environment (.env) instead of
// hardcoding them. Values flow into `Constants.expoConfig.extra` at runtime.
//
// Set these in mobile/.env (gitignored). See .env.example.
import 'dotenv/config';

export default {
  expo: {
    name: 'FocusFlow',
    slug: 'focusflow',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'focusflow',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      backgroundColor: '#0a0c0f',
      resizeMode: 'contain',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.charan.focusflow',
      infoPlist: {
        UIBackgroundModes: ['audio'],
      },
    },
    android: {
      package: 'com.charan.focusflow',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0a0c0f',
      },
    },
    plugins: [
      ['expo-notifications', { color: '#4ade80' }],
      'expo-asset',
      'expo-font',
      'expo-audio',
    ],
    extra: {
      apiUrl: process.env.API_URL || 'http://localhost:4000',
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || '',
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '',
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '',
    },
  },
};
