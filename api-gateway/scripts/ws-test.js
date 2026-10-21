// Cliente de prueba: se une a una función e imprime los eventos en vivo.
// Uso: node scripts/ws-test.js [showtimeId] [url]
const { io } = require('socket.io-client');

const showtimeId = Number(process.argv[2] || 1);
const url = process.argv[3] || 'http://localhost:4000';
const socket = io(url, { transports: ['websocket'] });

socket.on('connect', () => {
  socket.emit('showtime:join', { showtimeId }, (ack) => console.log(`[ws] unido a showtime:${showtimeId}`, ack));
});
['seat:locked', 'seat:released', 'seat:sold'].forEach((event) =>
  socket.on(event, (payload) => console.log(`[ws] ${event}`, JSON.stringify(payload))),
);
socket.on('connect_error', (err) => console.error('[ws] error de conexión:', err.message));
