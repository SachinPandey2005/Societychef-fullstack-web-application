import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { eq } from 'drizzle-orm';
import { AuthService } from '../services/auth.service';
import { ChatRepository } from '../repositories/chat.repository';
import { OrderRepository } from '../repositories/order.repository';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { DeliveryRepository } from '../repositories/delivery.repository';
import { db } from '../db/client';
import { deliveryPartners } from '../db/schema';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

function isAdmin(role?: string): boolean {
  const r = (role || '').toUpperCase();
  return r === 'ADMIN' || r === 'SUPER_ADMIN' || r.includes('OPERATIONS') || r === 'OPS';
}

/**
 * Authorizes a socket joining a given room — the same rooms
 * RealtimeService.broadcastEvent already publishes to (chat:<threadId>,
 * order:<orderId>, chef-orders:<kitchenId>, ops-orders:all, user:<profileId>,
 * delivery:<assignmentId>). Mirrors the ownership checks already enforced by
 * the equivalent REST endpoints (requireOrderOwnership, requireKitchenOwnership,
 * etc.) rather than inventing new rules.
 */
async function canJoinRoom(room: string, profile: any): Promise<boolean> {
  if (isAdmin(profile.role)) return true;

  const [prefix, id] = [room.slice(0, room.indexOf(':')), room.slice(room.indexOf(':') + 1)];

  switch (prefix) {
    case 'user':
      return id === profile.id;

    case 'chat': {
      const conversation = await ChatRepository.getConversationById(id);
      if (!conversation) return false;
      if (conversation.consumer_id === profile.id) return true;
      if (conversation.participant_1_id === profile.id || conversation.participant_2_id === profile.id) return true;
      if (conversation.kitchen_id) {
        const kitchen = await KitchenRepository.findById(conversation.kitchen_id);
        if (kitchen?.chef_user_id === profile.id) return true;
      }
      return false;
    }

    case 'order': {
      const order = await OrderRepository.getOrderById(id);
      if (!order) return false;
      if (order.customer_id === profile.id) return true;
      if (order.kitchen_id) {
        const kitchen = await KitchenRepository.findById(order.kitchen_id);
        if (kitchen?.chef_user_id === profile.id) return true;
      }
      return false;
    }

    case 'chef-orders': {
      const kitchen = await KitchenRepository.findById(id);
      return kitchen?.chef_user_id === profile.id;
    }

    case 'delivery': {
      const assignment = await DeliveryRepository.getAssignment(id).catch(() => null);
      if (!assignment) return false;
      // Read-only lookup — PartnerRepository.getOrCreatePartner has side
      // effects (auto-promotes a 'consumer' role, creates a row) that have
      // no business running just to check whether a socket may join a room.
      const partnerRows = await db.select({ id: deliveryPartners.id }).from(deliveryPartners).where(eq(deliveryPartners.userId, profile.id)).limit(1);
      if (partnerRows[0] && assignment.partner_id === partnerRows[0].id) return true;
      const order = await OrderRepository.getOrderById(assignment.order_id);
      if (order?.customer_id === profile.id) return true;
      if (order?.kitchen_id) {
        const kitchen = await KitchenRepository.findById(order.kitchen_id);
        if (kitchen?.chef_user_id === profile.id) return true;
      }
      return false;
    }

    case 'ops-orders':
      // isAdmin already handled above; any other caller is denied.
      return false;

    default:
      return false;
  }
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Authentication required'));
      const { profile } = await AuthService.verifyTokenWithDetails(token);
      socket.data.profile = profile;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const profile = socket.data.profile;
    logger.info(`[socket] connected: ${profile?.id}`);

    socket.on('join', async (room: string, ack?: (ok: boolean) => void) => {
      try {
        const allowed = await canJoinRoom(room, profile);
        if (allowed) {
          socket.join(room);
        }
        ack?.(allowed);
      } catch (err) {
        logger.error(`[socket] join authorization error for room ${room}`, err);
        ack?.(false);
      }
    });

    socket.on('leave', (room: string) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      logger.info(`[socket] disconnected: ${profile?.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
