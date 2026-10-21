const { Server } = require('socket.io');

const roomFor = (showtimeId) => `showtime:${showtimeId}`;

const parseShowtimeId = (payload) => {
  const id = Number(payload?.showtimeId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * WebSockets con el frontend. Cada cliente se une a la sala de la función que está viendo
 * y solo recibe los eventos de esa función.
 */
function initSocket(httpServer, corsOrigin) {
  const io = new Server(httpServer, { cors: { origin: corsOrigin } });

  io.on('connection', (socket) => {
    socket.on('showtime:join', (payload, ack) => {
      const showtimeId = parseShowtimeId(payload);
      if (!showtimeId) return typeof ack === 'function' && ack({ ok: false, message: 'showtimeId inválido' });
      socket.join(roomFor(showtimeId));
      return typeof ack === 'function' && ack({ ok: true });
    });

    socket.on('showtime:leave', (payload) => {
      const showtimeId = parseShowtimeId(payload);
      if (showtimeId) socket.leave(roomFor(showtimeId));
    });
  });

  return io;
}

module.exports = { initSocket, roomFor };
