import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

// See the matching comment in lib/apiClient.ts — Render is retired.
const defaultApiBase = 'https://backend-production-28028.up.railway.app';
const apiBase = process.env.EXPO_PUBLIC_API_URL || defaultApiBase;

let socket: Socket | null = null;

/**
 * One shared socket connection per app session, authenticated with the same
 * backend-issued JWT apiClient uses. Replaces the Supabase realtime channels
 * (postgres_changes/broadcast) services/supabase/index.ts used to open
 * directly — those watched Supabase's own Postgres, which stopped being
 * where this app's data actually lives once the backend moved to Drizzle/
 * local Postgres, so they'd silently never fire for anything written
 * through a converted endpoint.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(apiBase, {
    auth: { token: useAuthStore.getState().token },
    transports: ['websocket'],
    autoConnect: true,
  });

  // The token can change (login, refresh) after the socket was first
  // created — update the handshake auth so the next reconnect uses it.
  const unsubscribe = useAuthStore.subscribe((state) => {
    if (socket) {
      socket.auth = { token: state.token };
    }
  });

  socket.on('disconnect', () => {
    // no-op placeholder for future diagnostics; socket.io-client reconnects
    // automatically with the auth payload above.
  });

  socket.io.on('error', () => {});

  return socket;
}

/** Joins a room, awaiting the server's authorization ack before resolving. */
export function joinRoom(room: string): Promise<boolean> {
  return new Promise((resolve) => {
    const s = getSocket();
    const doJoin = () => s.emit('join', room, (ok: boolean) => resolve(!!ok));
    if (s.connected) {
      doJoin();
    } else {
      s.once('connect', doJoin);
    }
  });
}

export function leaveRoom(room: string): void {
  if (socket?.connected) {
    socket.emit('leave', room);
  }
}

/** Called on logout so a stale authenticated connection doesn't linger. */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
