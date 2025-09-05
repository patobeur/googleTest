// client/main.js

import { ThreeScene } from './three-scene.js';
import { UserInput } from './user-input.js';

// 1. Initialisation des modules
ThreeScene.init();
UserInput.init();

// 2. Connexion et logique Socket.IO
const socket = io();
let myId = null;

socket.on('connect', () => {
    myId = socket.id;
    console.log('Connecté au serveur avec l-ID:', myId);
});

socket.on('currentState', (allPlayers) => {
    for (let id in allPlayers) {
        if (allPlayers.hasOwnProperty(id)) {
            ThreeScene.addPlayer(allPlayers[id]);
        }
    }
});

socket.on('newPlayer', (playerInfo) => {
    ThreeScene.addPlayer(playerInfo);
});

socket.on('playerMoved', (playerInfo) => {
    ThreeScene.updatePlayerPosition(playerInfo);
});

socket.on('playerDisconnected', (id) => {
    ThreeScene.removePlayer(id);
});

// Le serveur nous renvoie à notre dernière position valide
socket.on('correction', (lastValidPosition) => {
    console.log('Correction de position reçue du serveur.');
    // On met à jour la position de notre joueur avec les données du serveur
    const correctedPlayerInfo = { id: myId, ...lastValidPosition };
    ThreeScene.updatePlayerPosition(correctedPlayerInfo);
});

// 3. Logique de jeu principale
const playerSpeed = 5;

function gameLogic() {
    // Vérifie si notre joueur existe dans la scène
    if (myId && ThreeScene.players[myId]) {
        let moved = false;
        const playerObject = ThreeScene.players[myId];

        if (UserInput.keys.ArrowUp) {
            playerObject.position.y += playerSpeed;
            moved = true;
        }
        if (UserInput.keys.ArrowDown) {
            playerObject.position.y -= playerSpeed;
            moved = true;
        }
        if (UserInput.keys.ArrowLeft) {
            playerObject.position.x -= playerSpeed;
            moved = true;
        }
        if (UserInput.keys.ArrowRight) {
            playerObject.position.x += playerSpeed;
            moved = true;
        }

        // Si on a bougé, on envoie la nouvelle position au serveur
        if (moved) {
            socket.emit('playerMovement', {
                x: playerObject.position.x,
                y: playerObject.position.y,
            });
        }
    }
}

// 4. Démarrage de la boucle d'animation avec notre logique de jeu
ThreeScene.animate(gameLogic);
