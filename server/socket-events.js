// This file will handle all socket.io event listeners.
const game = require('./game');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

function initSocketEvents(io) {
    // Middleware d'authentification Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                return next(new Error("Authentication error"));
            }
            const characterId = socket.handshake.auth.characterId;
            if (!characterId) {
                return next(new Error("Missing characterId"));
            }
            socket.userId = decoded.userId;
            socket.characterId = characterId;
            next();
        });
    });
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Pass the socket to the game module to handle player-specific logic
    game.onPlayerConnected(socket);

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      game.onPlayerDisconnected(socket);
    });

    socket.on('playerMovement', (movementData) => {
      game.onPlayerMovement(socket, movementData);
    });

    socket.on('pickupItem', (itemId) => {
        game.onPickupItem(io, socket, itemId);
    });

    socket.on('dropItem', (slotIndex) => {
        game.onDropItem(socket, slotIndex);
    });

    socket.on('moveItem', ({ fromIndex, toIndex }) => {
        game.onMoveItem(socket, { fromIndex, toIndex });
    });
  });
}

module.exports = { initSocketEvents };
