// server/game.js

// Ce module contient la logique de jeu principale

function initGame(io) {
    const players = {}; // Garder une trace des joueurs connectés

    io.on('connection', (socket) => {
        console.log('Un nouveau joueur est connecté:', socket.id);

        // Initialiser le joueur
        players[socket.id] = {
            id: socket.id,
            x: Math.floor(Math.random() * 400) + 50, // Position x aléatoire
            y: Math.floor(Math.random() * 400) + 50, // Position y aléatoire
            color: `hsl(${Math.random() * 360}, 100%, 50%)` // Couleur aléatoire
        };

        // Envoyer au nouveau joueur son état initial et l'état des autres joueurs
        socket.emit('currentState', players);

        // Informer les autres joueurs du nouvel arrivant
        socket.broadcast.emit('newPlayer', players[socket.id]);

        // Gérer la déconnexion
        socket.on('disconnect', () => {
            console.log('Un joueur s\'est déconnecté:', socket.id);
            delete players[socket.id];
            // Informer les autres joueurs de la déconnexion
            io.emit('playerDisconnected', socket.id);
        });

        // Gérer la mise à jour de la position du joueur avec validation
        socket.on('playerMovement', (movementData) => {
            const player = players[socket.id];
            if (!player) return;

            const lastPosition = { x: player.x, y: player.y };
            const newPosition = movementData;

            const distanceSq = Math.pow(newPosition.x - lastPosition.x, 2) + Math.pow(newPosition.y - lastPosition.y, 2);

            // La vitesse côté client est de 5. On tolère un peu plus pour la latence.
            const MAX_SPEED = 5;
            const TOLERANCE_FACTOR = 1.5;
            const MAX_DISTANCE_SQ = Math.pow(MAX_SPEED * TOLERANCE_FACTOR, 2);

            if (distanceSq <= MAX_DISTANCE_SQ) {
                // Mouvement valide : on met à jour la position et on diffuse
                player.x = newPosition.x;
                player.y = newPosition.y;
                socket.broadcast.emit('playerMoved', player);
            } else {
                // Mouvement invalide (trop rapide) : on corrige le client
                console.log(`Mouvement invalide détecté pour le joueur ${socket.id}.`);
                socket.emit('correction', lastPosition);
            }
        });
    });
}

module.exports = { initGame };
