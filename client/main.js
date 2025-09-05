// client/main.js

// 1. Connexion au serveur Socket.IO
const socket = io();

// 2. Initialisation de la scène Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 500;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lumière
const light = new THREE.AmbientLight(0xffffff); // lumière douce blanche
scene.add(light);

// 3. Gestion des joueurs
const players = {}; // Un objet pour stocker les objets 3D des joueurs
let myId = null; // L'ID de notre propre socket

// 4. Écoute des événements du serveur

// Événement pour stocker notre ID de socket
socket.on('connect', () => {
  myId = socket.id;
  console.log('Connecté au serveur avec l-ID:', myId);
});

// `currentState` est reçu une seule fois, à la connexion.
// Il contient la liste de tous les joueurs déjà présents.
socket.on('currentState', (allPlayers) => {
  for (let id in allPlayers) {
    if (allPlayers.hasOwnProperty(id)) {
      addPlayer(allPlayers[id]);
    }
  }
});

// `newPlayer` est reçu chaque fois qu'un nouveau joueur se connecte.
socket.on('newPlayer', (playerInfo) => {
  addPlayer(playerInfo);
});

// `playerMoved` est reçu quand un autre joueur bouge.
socket.on('playerMoved', (playerInfo) => {
  if (players[playerInfo.id]) {
    players[playerInfo.id].position.x = playerInfo.x;
    players[playerInfo.id].position.y = playerInfo.y;
  }
});

// `playerDisconnected` est reçu quand un joueur se déconnecte.
socket.on('playerDisconnected', (id) => {
  if (players[id]) {
    scene.remove(players[id]);
    delete players[id];
  }
});

// Fonction pour ajouter un joueur à la scène
function addPlayer(playerInfo) {
  const geometry = new THREE.BoxGeometry(30, 30, 30); // Un cube pour le joueur
  const material = new THREE.MeshStandardMaterial({ color: playerInfo.color });
  const playerCube = new THREE.Mesh(geometry, material);

  playerCube.position.x = playerInfo.x;
  playerCube.position.y = playerInfo.y;

  players[playerInfo.id] = playerCube;
  scene.add(playerCube);
}

// 5. Gestion des commandes du joueur
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

const playerSpeed = 5;

window.addEventListener('keydown', (event) => {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = false;
  }
});

// 6. Boucle de jeu
function animate() {
  requestAnimationFrame(animate);

  // Mouvement de notre joueur
  if (myId && players[myId]) {
    let moved = false;
    if (keys.ArrowUp) {
      players[myId].position.y += playerSpeed;
      moved = true;
    }
    if (keys.ArrowDown) {
      players[myId].position.y -= playerSpeed;
      moved = true;
    }
    if (keys.ArrowLeft) {
      players[myId].position.x -= playerSpeed;
      moved = true;
    }
    if (keys.ArrowRight) {
      players[myId].position.x += playerSpeed;
      moved = true;
    }

    // Si on a bougé, on envoie la nouvelle position au serveur
    if (moved) {
      socket.emit('playerMovement', {
        x: players[myId].position.x,
        y: players[myId].position.y,
      });
    }
  }

  renderer.render(scene, camera);
}

// Gérer le redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);


// Démarrer la boucle de jeu
animate();
