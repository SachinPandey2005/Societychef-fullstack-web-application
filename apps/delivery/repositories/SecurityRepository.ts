import * as LocalAuthentication from 'expo-local-authentication';
import { useSecurityStore } from '../store/useSecurityStore';

export class SecurityRepository {
  static async checkBiometricsSupport(): Promise<void> {
    const store = useSecurityStore.getState();
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      store.setBiometricsAvailable(hasHardware && isEnrolled);
    } catch (e) {
      console.warn('[SecurityRepository] Biometrics check error:', e);
      store.setBiometricsAvailable(false);
    }
  }

  static async authenticateBiometrics(promptMessage = 'Authenticate to access RasoHi'): Promise<boolean> {
    const store = useSecurityStore.getState();
    if (store.isLocked) {
      console.warn('[SecurityRepository] Biometric login locked due to repeated failures.');
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        store.resetFailedAttempts();
        return true;
      } else {
        store.incrementFailedAttempts();
        return false;
      }
    } catch (e: any) {
      console.warn('[SecurityRepository] Authentication process failed:', e.message);
      store.incrementFailedAttempts();
      return false;
    }
  }

  static toggleBiometrics(enabled: boolean): void {
    const store = useSecurityStore.getState();
    store.setBiometricsEnabled(enabled);
  }
}

export default SecurityRepository;
