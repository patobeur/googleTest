const jwt = require('jsonwebtoken');
const { getPlayerByUserId, createPlayer, updatePlayer } = require('./db');
const jwtSecret = 'supersecretkey'; // In a real app, use an environment variable

function initGame(io) {
    const players = {};

    // Middleware d'authentification Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                return next(new Error('Authentication error'));
            }
            socket.userId = decoded.userId;
            next();
        });
    });

    io.on('connection', async (socket) => {
        console.log('Un nouveau joueur est connecté:', socket.id, 'avec le userId:', socket.userId);

        let player = await getPlayerByUserId(socket.userId);
        if (!player) {
            player = {
                id: socket.id,
                userId: socket.userId,
                x: Math.floor(Math.random() * 400) + 50,
                y: Math.floor(Math.random() * 400) + 50,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            };
            await createPlayer(player);
        } else {
            player.id = socket.id; // Update socket id
        }

        players[socket.id] = player;

        socket.emit('currentState', players);
        socket.broadcast.emit('newPlayer', player);

        socket.on('disconnect', async () => {
            console.log('Un joueur s\'est déconnecté:', socket.id);
            await updatePlayer(players[socket.id]);
            delete players[socket.id];
            io.emit('playerDisconnected', socket.id);
        });

        socket.on('playerMovement', (movementData) => {
            const player = players[socket.id];
            if (!player) return;

            const lastPosition = { x: player.x, y: player.y };
            const newPosition = movementData;

            const distanceSq = Math.pow(newPosition.x - lastPosition.x, 2) + Math.pow(newPosition.y - lastPosition.y, 2);

            const MAX_SPEED = 5;
            const TOLERANCE_FACTOR = 1.5;
            const MAX_DISTANCE_SQ = Math.pow(MAX_SPEED * TOLERANCE_FACTOR, 2);

            if (distanceSq <= MAX_DISTANCE_SQ) {
                player.x = newPosition.x;
                player.y = newPosition.y;
                socket.broadcast.emit('playerMoved', player);
            } else {
                console.log(`Mouvement invalide détecté pour le joueur ${socket.id}.`);
                socket.emit('correction', lastPosition);
            }
        });
    });
}

module.exports = { initGame };
