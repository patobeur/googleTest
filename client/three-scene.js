import * as THREE from "three";
import { Character } from "./Character.js";
import { ThirdPersonController } from "./ThirdPersonController.js";
import { UserInput } from "./user-input.js";

const clock = new THREE.Clock();
const players = {};
let scene, renderer, camera, thirdPersonController;
let localPlayerId = null;

function setLocalPlayerId(id) {
	localPlayerId = id;
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

	renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(window.devicePixelRatio);

	const light = new THREE.AmbientLight(0xffffff, 1.5);
	scene.add(light);
	const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
	dirLight.position.set(5, 10, 7.5);
	scene.add(dirLight);

	const grid = new THREE.GridHelper(50, 50, 0x888888, 0x444444);
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

	if (thirdPersonController) {
		thirdPersonController.update(deltaTime);
	}

	for (const id in players) {
		const player = players[id];
		if (player.character) {
			player.character.update(deltaTime);

			// Update name label position
			if (player.nameLabel) {
				const modelPosition = player.character.model.position.clone();
				modelPosition.y += 3.5; // Adjust this value to position the label above the head
				const screenPosition = modelPosition.project(camera);

				const x = ((screenPosition.x + 1) / 2) * window.innerWidth;
				const y = ((-screenPosition.y + 1) / 2) * window.innerHeight;

				player.nameLabel.style.transform = `translate(-50%, -50%)`;
				player.nameLabel.style.left = `${x}px`;
				player.nameLabel.style.top = `${y}px`;
			}
		}
	}

	gameLogicCallback();

	renderer.render(scene, camera);
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

	const isLocal = playerInfo.id === localPlayerId;
	const character = new Character(scene, {
		isLocal: isLocal,
		onLoadCallback: (loadedCharacter) => {
			loadedCharacter.setPosition(playerInfo.x, 0, playerInfo.y); // Use Y from server as Z

			// Create name label
			const nameLabel = document.createElement("div");
			nameLabel.className = "name-label";
			nameLabel.textContent = playerInfo.name;
			document.getElementById("game-container").appendChild(nameLabel);

			players[playerInfo.id] = {
				...playerInfo,
				character: loadedCharacter,
				position: new THREE.Vector3(playerInfo.x, 0, playerInfo.y),
				nameLabel: nameLabel,
			};

			if (isLocal) {
				thirdPersonController = new ThirdPersonController({
					camera: camera,
					character: loadedCharacter,
					scene: scene,
				});
			}
		},
	});

	character.load(modelUrl);
}

function updatePlayerPosition(playerInfo) {
	// Only update remote players, local player is updated by its controller
	if (playerInfo.id === localPlayerId) return;

	const player = players[playerInfo.id];
	if (player && player.character) {
		// Use the new methods on the Character class
		player.character.setTargetPosition(playerInfo.x, 0, playerInfo.y); // Use Y from server as Z

		if (playerInfo.rotation) {
			player.character.setTargetRotation(
				playerInfo.rotation.x,
				playerInfo.rotation.y,
				playerInfo.rotation.z,
				playerInfo.rotation.w
			);
		}

		if (playerInfo.animation) {
			player.character.playAnimation(playerInfo.animation);
		}
	}
}

function removePlayer(id) {
	const player = players[id];
	if (player) {
		if (player.character) {
			scene.remove(player.character.model);
		}
		if (player.nameLabel) {
			player.nameLabel.remove();
		}
		delete players[id];
	}
}

export const ThreeScene = {
	init,
	animate,
	addPlayer,
	updatePlayerPosition,
	removePlayer,
	setLocalPlayerId,
	players,
};
