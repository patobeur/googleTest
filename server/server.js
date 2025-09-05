// server/server.js

const http = require('http');
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Garder une trace des joueurs connectés
const players = {};

// Servir les fichiers statiques du client
// On remonte d'un niveau (de server/ à la racine) puis on va dans client/
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

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

  // Gérer la mise à jour de la position du joueur
  socket.on('playerMovement', (movementData) => {
    const player = players[socket.id] || {};
    player.x = movementData.x;
    player.y = movementData.y;
    // Diffuser la nouvelle position à tous les autres joueurs
    socket.broadcast.emit('playerMoved', player);
  });
});

server.listen(PORT, () => {
  console.log(`Le serveur de jeu est lancé sur le port ${PORT}`);
});
