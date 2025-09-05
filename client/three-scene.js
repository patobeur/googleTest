// client/three-scene.js

// Ce module gère la scène 3D avec Three.js

const players = {}; // Stocke les objets 3D des joueurs

let scene, camera, renderer;

// Initialise la scène, la caméra, le rendu et les lumières.
function init(canvas) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    // La position Z est maintenant gérée par updateCamera
    camera.position.z = 500; // Valeur de départ par défaut

    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

    window.addEventListener('resize', onWindowResize, false);
}

// Gère le redimensionnement de la fenêtre
function onWindowResize() {
    if (!camera || !renderer) return;
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    // Pas besoin de redimensionner le renderer ici si le canevas est géré par CSS
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

// Met à jour la caméra pour suivre le joueur et gérer le zoom
function updateCamera(player, zoomDelta) {
    if (!camera || !player) return;

    // Suivi du joueur
    camera.position.x = player.position.x;
    camera.position.y = player.position.y;

    // Gestion du zoom
    const zoomSpeed = 20;
    const minZoom = 200;
    const maxZoom = 800;

    // Applique le zoom en fonction du delta de la molette
    camera.position.z -= zoomDelta * zoomSpeed;

    // Bloque le zoom dans les limites définies
    camera.position.z = Math.max(minZoom, Math.min(maxZoom, camera.position.z));
}


// Exporte les fonctions pour les rendre utilisables par d'autres modules
export const ThreeScene = {
    init,
    animate,
    addPlayer,
    updatePlayerPosition,
    removePlayer,
    updateCamera,
    // Expose l'objet players pour que la logique de jeu puisse y accéder
    players
};
