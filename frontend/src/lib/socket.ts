import { io, type Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

/** Conexión WebSocket única compartida por toda la app. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, { transports: ['websocket'] });
  }
  return socket;
}
