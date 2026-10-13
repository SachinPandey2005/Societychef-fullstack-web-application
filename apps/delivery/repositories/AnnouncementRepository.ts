import { dashboardApi } from '../api/dashboard.api';
import { useDashboardStore } from '../store/useDashboardStore';

export class AnnouncementRepository {
  static async fetchAnnouncements(): Promise<void> {
    try {
      const data = await dashboardApi.getAnnouncements();
      useDashboardStore.setState({ announcements: data || [] });
    } catch (error: any) {
      console.warn('[AnnouncementRepository] Fetch announcements warning:', error.message);
    }
  }
}

export default AnnouncementRepository;
