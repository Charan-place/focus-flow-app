// Sound, speech, haptics, and notifications — the mobile versions of the
// extension's chime / TTS / chrome.notifications.

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

const SOUNDS = {
  focusComplete: require('../assets/focus-complete.wav'),
  breakComplete: require('../assets/break-complete.wav'),
  victory: require('../assets/victory.wav'),
};

let configured = false;
async function configureAudio() {
  if (configured) return;
  configured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  } catch {}
}

export async function playSound(name, volume = 0.7) {
  try {
    await configureAudio();
    const asset = SOUNDS[name];
    if (!asset) return;
    const player = createAudioPlayer(asset);
    player.volume = volume;
    player.play();
    // Release the player once playback finishes.
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        try { player.remove(); } catch {}
      }
    });
  } catch {}
}

export function speak(text, { rate = 0.95, pitch = 1.0 } = {}) {
  try {
    Speech.stop();
    Speech.speak(text, { rate, pitch });
  } catch {}
}

export function haptic(type = 'success') {
  try {
    if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

// ── Notifications ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      return req.status === 'granted';
    }
    return true;
  } catch {
    return false;
  }
}

export async function notify(title, body) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // immediate
    });
  } catch {}
}
