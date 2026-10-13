import { devicesApi } from '../api/devices.api';
import { useDeviceStore } from '../store/useDeviceStore';

export class DeviceRepository {
  static async fetchDevices(): Promise<void> {
    const store = useDeviceStore.getState();
    store.setLoading(true);
    try {
      const items = await devicesApi.getDevices();
      if (items) {
        store.setDevices(items);
      }
    } catch (e: any) {
      console.warn('[DeviceRepository] Fetch devices error:', e.message);
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  }

  static async logoutDevice(deviceId: string): Promise<void> {
    const store = useDeviceStore.getState();
    store.setLoading(true);
    try {
      await devicesApi.logoutDevice({ deviceId });
      store.removeDevice(deviceId);
    } catch (e: any) {
      console.warn('[DeviceRepository] Logout device error:', e.message);
      store.setError(e.message);
      throw e;
    } finally {
      store.setLoading(false);
    }
  }

  static async logoutAllOthers(currentDeviceId: string): Promise<void> {
    const store = useDeviceStore.getState();
    store.setLoading(true);
    try {
      await devicesApi.logoutDevice({ logoutAllOthers: true, deviceId: currentDeviceId });
      const current = store.devices.filter((d) => d.id === currentDeviceId);
      store.setDevices(current);
    } catch (e: any) {
      console.warn('[DeviceRepository] Logout other devices error:', e.message);
      store.setError(e.message);
      throw e;
    } finally {
      store.setLoading(false);
    }
  }
}

export default DeviceRepository;
