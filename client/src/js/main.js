// client/main.js

import * as THREE from "three";
import { ThreeScene } from "./three-scene.js";
import { UserInput } from "./user-input.js";
import { Auth } from "./auth.js";
import { UI } from "./ui.js";
import { CharacterSelection } from "./character-selection.js";
// Game Logic (to be initialized after login)
function initializeGame(token, character) {
	// Show the game container
	document.getElementById("game-container").style.display = "block";

	// 1. Initialisation des modules
	// For now, we use localStorage, but this should come from the character object
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

				// If this is the local player, update the inventory UI
				if (id === myId) {
					UI.updateInventory(playerInfo.inventory);
				}
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

	let inventoryOpen = false;
	function toggleInventory() {
		inventoryOpen = !inventoryOpen;
		if (inventoryOpen) {
			UI.openInventory();
		} else {
			UI.closeInventory();
		}
	}

	socket.on("worldItems", (items) => {
		items.forEach((item) => ThreeScene.addItem(item));
	});

	socket.on("itemSpawned", (item) => {
		ThreeScene.addItem(item);
	});

	socket.on("itemPickedUp", (itemId) => {
		ThreeScene.removeItem(itemId);
	});

	socket.on("inventoryUpdate", (inventory) => {
		const player = ThreeScene.players[myId];
		if (player) {
			player.inventory = inventory;
		}
		UI.updateInventory(inventory);
	});

	UI.setOnDropItem((slotIndex) => {
		socket.emit("dropItem", slotIndex);
	});

	UI.setOnMoveItem(({ fromIndex, toIndex }) => {
		socket.emit("moveItem", { fromIndex, toIndex });
	});

    // State to prevent sending data on every frame
    const lastSent = {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        animation: "",
    };
    const thresholds = {
        position: 0.01,
        quaternion: 0.01,
    };

	function gameLogic() {
        // This function sends the local player's state to the server.
		if (!myId || !ThreeScene.players[myId] || !ThreeScene.players[myId].character) {
            return;
        }

        const character = ThreeScene.players[myId].character;
        const currentPosition = character.model.position;
        const currentQuaternion = character.targetQuaternion;
        const currentAnimation = character.currentAction ? character.currentAction.getClip().name.toLowerCase() : "";


        const positionChanged = currentPosition.distanceToSquared(lastSent.position) > thresholds.position * thresholds.position;
        const rotationChanged = !currentQuaternion.equals(lastSent.quaternion);
        const animationChanged = currentAnimation !== lastSent.animation;

        if (positionChanged || rotationChanged || animationChanged) {
            const movementData = {
                x: currentPosition.x,
                y: currentPosition.z, // Server expects z as y
                rotation: {
                    x: currentQuaternion.x,
                    y: currentQuaternion.y,
                    z: currentQuaternion.z,
                    w: currentQuaternion.w,
                },
                animation: currentAnimation,
            };

            socket.emit("playerMovement", movementData);

            lastSent.position.copy(currentPosition);
            lastSent.quaternion.copy(currentQuaternion);
            lastSent.animation = currentAnimation;
        }

		const actions = UserInput.getAndResetActions();
		if (actions.inventory) {
			toggleInventory();
		}
		if (actions.pickup) {
			const closestItem = ThreeScene.findClosestItem(currentPosition);
			if (closestItem) {
				socket.emit("pickupItem", closestItem.id);
			}
		}
	}

	ThreeScene.animate(gameLogic);
}

// --- Main Execution ---
function main() {
	// The new flow: Auth -> CharacterSelection -> Game
	CharacterSelection.init(initializeGame);
	Auth.init(CharacterSelection.show);
}

window.addEventListener("DOMContentLoaded", main);
