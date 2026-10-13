import { getIO } from '../realtime/socketServer';
import { logger } from '../utils/logger';

export class RealtimeService {
  /**
   * Broadcasts an event to every socket that has joined `channelName`
   * (see realtime/socketServer.ts#canJoinRoom for who's allowed to join
   * which room). Previously used supabase.channel().send() — the
   * self-hosted Socket.io server replacing it is also what makes this no
   * longer dependent on Supabase's Postgres realtime config, which these
   * channel names never actually corresponded to real tables/replication
   * anyway for most of these (delivery/order/user channels were always
   * synthetic broadcast-only channels, not postgres_changes).
   */
  static async broadcastEvent(channelName: string, eventName: string, payload: any) {
    try {
      const io = getIO();
      if (!io) {
        logger.warn(`[realtime] Socket server not initialized — dropped event [${eventName}] to [${channelName}]`);
        return;
      }
      io.to(channelName).emit(eventName, payload);
    } catch (error: any) {
      logger.error(`Error broadcasting realtime event [${eventName}] to channel [${channelName}]: ${error.message}`);
    }
  }
}
