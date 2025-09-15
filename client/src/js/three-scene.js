import * as THREE from "three";
import { ThirdPersonController } from "./ThirdPersonController.js";
import { UserInput } from "./user-input.js";
import { resourceManager } from "./resource-manager.js";
import { PlayerManager } from "./player-manager.js"; // Import the new manager

const clock = new THREE.Clock();
// const players = {}; // Removed, now in PlayerManager
const worldItems = {};
let scene, renderer, camera; // Removed thirdPersonController from here
// let localPlayerId = null; // Removed, now in PlayerManager

function setLocalPlayerId(id) {
	// localPlayerId = id; // Delegated
    PlayerManager.setLocalPlayerId(id);
}

function init(canvas) {
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x222222);

	camera = new THREE.PerspectiveCamera(
		60,
		canvas.clientWidth / canvas.clientHeight,
		0.1,
		1000
	);

    PlayerManager.initManager(scene, camera); // Initialize the PlayerManager

	renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(window.devicePixelRatio);

	const light = new THREE.AmbientLight(0xffffff, 1.5);
	scene.add(light);
	const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
	dirLight.position.set(5, 10, 7.5);
	scene.add(dirLight);

	const grid = new THREE.GridHelper(500, 500, 0x888888, 0x444444);
	scene.add(grid);

	window.addEventListener("resize", onWindowResize, false);
	onWindowResize();
}

function onWindowResize() {
	if (!renderer || !camera) return;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

let gameLogicCallback = () => {};

function renderLoop() {
	requestAnimationFrame(renderLoop);
	const deltaTime = clock.getDelta();

    // The PlayerManager now handles updating the controller and all players
    PlayerManager.update(deltaTime);

	gameLogicCallback();

	renderer.render(scene, camera);
}

function animate(gameLogic) {
	if (gameLogic) {
		gameLogicCallback = gameLogic;
	}
	renderLoop();
}

// addPlayer function removed

// updatePlayerPosition function removed

// removePlayer function removed

function addItem(itemInfo) {
    if (!resourceManager.canDisplayItem(itemInfo.type)) {
        return;
    }

    const itemModelInfo = resourceManager.itemModels[itemInfo.type];
    if (!itemModelInfo) {
        console.warn(`No model info for item type: ${itemInfo.type}`);
        return;
    }

	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshStandardMaterial({ color: itemModelInfo.color || 0xffffff });
	const cube = new THREE.Mesh(geometry, material);

	cube.position.set(itemInfo.x, itemInfo.y, itemInfo.z);
	scene.add(cube);
	worldItems[itemInfo.id] = { ...itemInfo, mesh: cube };
    resourceManager.registerItem(itemInfo.type);
}

function removeItem(itemId) {
	const item = worldItems[itemId];
	if (item) {
		scene.remove(item.mesh);
        resourceManager.unregisterItem(item.type);
		delete worldItems[itemId];
	}
}

function findClosestItem(playerPosition) {
	let closestItem = null;
	let minDistance = Infinity;
	for (const id in worldItems) {
		const item = worldItems[id];
		const distance = playerPosition.distanceTo(item.mesh.position);
		if (distance < minDistance) {
			minDistance = distance;
			closestItem = item;
		}
	}
	return closestItem;
}

export const ThreeScene = {
	init,
	animate,
    // addPlayer, updatePlayerPosition, removePlayer are removed
	setLocalPlayerId,
	// players, // removed
	addItem,
	removeItem,
	findClosestItem,
};
