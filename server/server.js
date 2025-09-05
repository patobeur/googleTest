// server/server.js

const http = require('http');
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const { initGame } = require('./game.js'); // Importer la logique de jeu

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques du client
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Initialiser la logique de jeu en lui passant l'instance io
initGame(io);

server.listen(PORT, () => {
  console.log(`Le serveur de jeu est lancé sur le port ${PORT}`);
});
