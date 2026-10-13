import { useAvailabilityStore } from '../store/useAvailabilityStore';
import { useCrmStatusStore } from '../store/useCrmStatusStore';
import { dashboardApi } from '../api/dashboard.api';

class HeartbeatService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private intervalMs = 25000; // 25 seconds heartbeat interval

  startHeartbeat() {
    this.stopHeartbeat();
    this.sendPing();
    this.timerId = setInterval(() => {
      this.sendPing();
    }, this.intervalMs);
  }

  stopHeartbeat() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private async sendPing() {
    const isOnline = useAvailabilityStore.getState().isOnline;
    if (!isOnline) {
      return;
    }

    try {
      const status = useAvailabilityStore.getState().status;
      await dashboardApi.updatePartnerStatus(status);
      useCrmStatusStore.getState().touchSync();
      useCrmStatusStore.getState().resetReconnect();
    } catch (error) {
      console.warn('[HeartbeatService] Heartbeat ping failed, incrementing reconnect counter');
      useCrmStatusStore.getState().incrementReconnect();
    }
  }
}

export const heartbeatService = new HeartbeatService();
export default heartbeatService;
