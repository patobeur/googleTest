import * as THREE from "three";
import { Character } from "./Character.js";
import { Camera } from "./camera.js";

const clock = new THREE.Clock();
const players = {}; // Stocke les données des joueurs, y compris le modèle de personnage
let scene, renderer;
let localPlayerId = null;

function setLocalPlayerId(id) {
	localPlayerId = id;
}

// Initialise la scène, la caméra, le rendu et les lumières.
function init(canvas) {
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x222222);

	Camera.init(canvas, scene);

	renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);

	const light = new THREE.AmbientLight(0xffffff);
	scene.add(light);

	addCenteredCube();

	window.addEventListener("resize", onWindowResize, false);
	onWindowResize();
	console.log("scene on");

	const grid = new THREE.GridHelper(5000, 5000 / 10, 0x666666, 0x444444);
	grid.rotateX(Math.PI / 2);
	scene.add(grid);
}

function onWindowResize() {
	if (!renderer) return;
	renderer.setSize(window.innerWidth, window.innerHeight);
}

let gameLogicCallback = () => {};

function renderLoop() {
	requestAnimationFrame(renderLoop);
	const deltaTime = clock.getDelta();

	// Mettre à jour les animations des personnages
	for (const id in players) {
		if (players[id].character) {
			players[id].character.update(deltaTime);
		}
	}

	gameLogicCallback();

	renderer.render(scene, Camera.camera);
}

function animate(gameLogic) {
	if (gameLogic) {
		gameLogicCallback = gameLogic;
	}
	renderLoop();
}

function addPlayer(playerInfo) {
	const modelName =
		playerInfo.model === "female" ? "Kimono_Female.gltf" : "Kimono_Male.gltf";
	const modelUrl = `/toon/${modelName}`;

	const character = new Character(scene, (loadedCharacter) => {
		// Une fois le modèle chargé, configurez sa position et stockez-le
		loadedCharacter.setPosition(playerInfo.x, playerInfo.y, 0);

		// Stocker l'instance du personnage et sa position initiale
		players[playerInfo.id] = {
			...playerInfo,
			character: loadedCharacter,
			position: new THREE.Vector3(playerInfo.x, playerInfo.y, 0),
		};
	});

	character.load(modelUrl);
}

function addCenteredCube() {
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
	const cube = new THREE.Mesh(geometry, material);

	cube.position.x = 0;
	cube.position.y = 0;
	cube.position.z = 0.5;

	scene.add(cube);
}

function updatePlayerPosition(playerInfo) {
	const player = players[playerInfo.id];
	if (player && player.character) {
		const oldPos = player.position.clone();
		const newPos = new THREE.Vector3(playerInfo.x, playerInfo.y, 0);

		player.character.setPosition(newPos.x, newPos.y, newPos.z);
		player.position.copy(newPos);

		// Déterminer si le joueur bouge et jouer l'animation appropriée
		const distance = oldPos.distanceTo(newPos);
		if (distance > 0.1) {
			// Seuil pour considérer un mouvement
			player.character.playAnimation("Run"); // Assumant que l'animation s'appelle "Run"
		} else {
			player.character.playAnimation("Idle"); // Assumant que l'animation s'appelle "Idle"
		}
	}
}

function removePlayer(id) {
	const player = players[id];
	if (player && player.character) {
		scene.remove(player.character.model);
		delete players[id];
	}
}

function updateCamera(myId, zoomDelta) {
	const player = players[myId];
	if (player) {
		Camera.update(player, zoomDelta);
	}
}

function playLocalPlayerAnimation(animationName) {
	if (
		localPlayerId &&
		players[localPlayerId] &&
		players[localPlayerId].character
	) {
		players[localPlayerId].character.playAnimation(animationName);
	}
}

export const ThreeScene = {
	init,
	animate,
	addPlayer,
	updatePlayerPosition,
	removePlayer,
	updateCamera,
	setLocalPlayerId,
	playLocalPlayerAnimation,
	// Expose l'objet players pour que la logique de jeu puisse y accéder
	players,
};
