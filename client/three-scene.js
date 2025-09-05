// client/three-scene.js

// Ce module gère la scène 3D avec Three.js

const players = {}; // Stocke les objets 3D des joueurs

let scene, camera, renderer;

// Initialise la scène, la caméra, le rendu et les lumières.
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 500;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

    window.addEventListener('resize', onWindowResize, false);
}

// Gère le redimensionnement de la fenêtre
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// La boucle d'animation
let gameLogicCallback = () => {}; // Logique de jeu à exécuter

function renderLoop() {
    requestAnimationFrame(renderLoop);

    // Exécute la logique de jeu
    gameLogicCallback();

    renderer.render(scene, camera);
}

// Démarre la boucle d'animation avec la logique de jeu fournie
function animate(gameLogic) {
    if (gameLogic) {
        gameLogicCallback = gameLogic;
    }
    renderLoop();
}

// Ajoute un joueur (un cube) à la scène
function addPlayer(playerInfo) {
    const geometry = new THREE.BoxGeometry(30, 30, 30);
    const material = new THREE.MeshStandardMaterial({ color: playerInfo.color });
    const playerCube = new THREE.Mesh(geometry, material);

    playerCube.position.x = playerInfo.x;
    playerCube.position.y = playerInfo.y;

    players[playerInfo.id] = playerCube;
    scene.add(playerCube);
}

// Met à jour la position d'un joueur existant
function updatePlayerPosition(playerInfo) {
    if (players[playerInfo.id]) {
        players[playerInfo.id].position.x = playerInfo.x;
        players[playerInfo.id].position.y = playerInfo.y;
    }
}

// Supprime un joueur de la scène
function removePlayer(id) {
    if (players[id]) {
        scene.remove(players[id]);
        delete players[id];
    }
}

// Exporte les fonctions pour les rendre utilisables par d'autres modules
export const ThreeScene = {
    init,
    animate,
    addPlayer,
    updatePlayerPosition,
    removePlayer,
    // Expose l'objet players pour que la logique de jeu puisse y accéder
    players
};
