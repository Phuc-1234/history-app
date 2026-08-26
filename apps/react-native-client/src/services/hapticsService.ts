import * as Haptics from 'expo-haptics';
import { store } from '../store/store';

export function hapticSuccess() {
  const state = store.getState();
  if (state.settings?.hapticsEnabled) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
}

export function hapticError() {
  const state = store.getState();
  if (state.settings?.hapticsEnabled) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }
}

export function hapticLight() {
  const state = store.getState();
  if (state.settings?.hapticsEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export function hapticMedium() {
  const state = store.getState();
  if (state.settings?.hapticsEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }
}

export function hapticHeavy() {
  const state = store.getState();
  if (state.settings?.hapticsEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }
}

const hapticsService = {
  hapticSuccess,
  hapticError,
  hapticLight,
  hapticMedium,
  hapticHeavy,
};

export default hapticsService;
