// client/main.js

import * as THREE from "three";
import { ThreeScene } from "./three-scene.js";
import { UserInput } from "./user-input.js";
import { Auth } from "./auth.js";
import { UI } from "./ui.js";
import { Camera } from "./camera.js";

const playerSpeed = 0.1;

// Game Logic (to be initialized after login)
function initializeGame(token) {
	// 1. Initialisation des modules
	const savedModel = localStorage.getItem("playerModel") || "male";
	const savedColor = localStorage.getItem("playerColor") || "#ff0000";

	ThreeScene.init(document.getElementById("game-canvas"));
	UserInput.init();
	UI.init();

	// 2. Connexion et logique Socket.IO
	const socket = io({
		auth: {
			token,
			model: savedModel,
			color: savedColor,
		},
	});
	let myId = null;

	socket.on("connect", () => {
		myId = socket.id;
		ThreeScene.setLocalPlayerId(myId);
		console.log("Connecté au serveur avec l-ID:", myId);
	});

	socket.on("connect_error", (err) => {
		if (err.message === "Authentication error") {
			console.error("Authentication failed, please log in again.");
			localStorage.removeItem("token");
			window.location.reload();
		}
	});

	socket.on("currentState", (allPlayers) => {
		for (let id in allPlayers) {
			if (allPlayers.hasOwnProperty(id)) {
				const playerInfo = allPlayers[id];
				if (!playerInfo.model) {
					playerInfo.model = localStorage.getItem("playerModel") || "male";
				}
				ThreeScene.addPlayer(playerInfo);
			}
		}
	});

	socket.on("newPlayer", (playerInfo) => {
		if (!playerInfo.model) {
			playerInfo.model = localStorage.getItem("playerModel") || "male";
		}
		ThreeScene.addPlayer(playerInfo);
	});

	socket.on("playerMoved", (playerInfo) => {
		ThreeScene.updatePlayerPosition(playerInfo);
	});

	socket.on("playerDisconnected", (id) => {
		ThreeScene.removePlayer(id);
	});

	socket.on("correction", (lastValidPosition) => {
		const correctedPlayerInfo = { id: myId, ...lastValidPosition };
		ThreeScene.updatePlayerPosition(correctedPlayerInfo);
	});

	const forwardVector = new THREE.Vector3();
	const rightVector = new THREE.Vector3();

	function gameLogic() {
		if (myId && ThreeScene.players[myId]) {
			const playerObject = ThreeScene.players[myId];
			let moved = false;

			// Get camera direction
			const cameraDirection = Camera.camRig.getWorldDirection(new THREE.Vector3());
			forwardVector.set(cameraDirection.x, cameraDirection.y, 0).normalize();
			rightVector.set(forwardVector.y, -forwardVector.x, 0);

			const moveDirection = new THREE.Vector3();

			if (UserInput.keys.ArrowUp || UserInput.keys["z"]) {
				moveDirection.add(forwardVector);
				moved = true;
			}
			if (UserInput.keys.ArrowDown || UserInput.keys["s"]) {
				moveDirection.sub(forwardVector);
				moved = true;
			}
			if (UserInput.keys.ArrowLeft || UserInput.keys["q"]) {
				moveDirection.sub(rightVector);
				moved = true;
			}
			if (UserInput.keys.ArrowRight || UserInput.keys["d"]) {
				moveDirection.add(rightVector);
				moved = true;
			}

			if (moved) {
				playerObject.position.add(moveDirection.normalize().multiplyScalar(playerSpeed));
				socket.emit("playerMovement", {
					x: playerObject.position.x,
					y: playerObject.position.y,
				});
			}

			// Animation
			if (UserInput.jumpJustPressed) {
				ThreeScene.playLocalPlayerAnimation("jump");
			} else if (moved) {
				ThreeScene.playLocalPlayerAnimation("run");
			} else {
				ThreeScene.playLocalPlayerAnimation("idle");
			}

			// Update camera
			ThreeScene.updateCamera(myId, UserInput.zoomDelta);
			UserInput.resetZoom();
		}
	}

	ThreeScene.animate(gameLogic);
}

// --- Main Execution ---
function main() {
	Auth.init(initializeGame);
}

window.addEventListener("load", main);
