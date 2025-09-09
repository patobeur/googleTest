// client/main.js

import * as THREE from "three";
import { ThreeScene } from "./three-scene.js";
import { UserInput } from "./user-input.js";
import { Auth } from "./auth.js";
import { UI } from "./ui.js";
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

    // A simple state to prevent sending data on every frame
    const lastSentPosition = new THREE.Vector3();
    const positionThreshold = 0.01; // Only send update if moved more than this

	function gameLogic() {
        // The new game logic's only job is to send the local player's state to the server.
        // The ThirdPersonController handles all the movement and camera logic.
		if (myId && ThreeScene.players[myId] && ThreeScene.players[myId].character) {
            const playerModel = ThreeScene.players[myId].character.model;
            const currentPosition = playerModel.position;

            // Check if player has moved enough to warrant an update
            if(currentPosition.distanceToSquared(lastSentPosition) > positionThreshold * positionThreshold) {
                // Remember: the server still thinks Y is forward, so we send 'z' as 'y'.
                socket.emit("playerMovement", {
                    x: currentPosition.x,
                    y: currentPosition.z,
                });
                lastSentPosition.copy(currentPosition);
            }
		}
	}

	ThreeScene.animate(gameLogic);
}

// --- Main Execution ---
function main() {
	Auth.init(initializeGame);
}

window.addEventListener("load", main);
