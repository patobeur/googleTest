import * as THREE from "three";
import { ThreeScene } from "./three-scene.js";
import { PlayerManager } from "./player-manager.js";
import { UserInput } from "./user-input.js";
import { UI } from "./ui.js";
import { SocketManager } from "./socket-manager.js";

function initializeGame(token, character) {
    document.getElementById('game-container').style.display = 'block';
	document.body.classList.add("game-active");

	ThreeScene.init(document.getElementById("game-canvas"));
	UserInput.init();
	SocketManager.initSocket(token, character);

	const socket = SocketManager.getSocket();
	UI.init(socket);

	let inventoryOpen = false;
	function toggleInventory() {
		inventoryOpen = !inventoryOpen;
		if (inventoryOpen) {
			UI.openInventory();
		} else {
			UI.closeInventory();
		}
	}

	UI.setOnDropItem((slotIndex) => {
		socket.emit("dropItem", slotIndex);
	});

	UI.setOnMoveItem(({ fromIndex, toIndex }) => {
		socket.emit("moveItem", { fromIndex, toIndex });
	});

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
        const localPlayer = PlayerManager.getLocalPlayer();
		if (!localPlayer || !localPlayer.character) {
            return;
        }

        const character = localPlayer.character;
        const currentPosition = character.model.position;
        const currentQuaternion = character.targetQuaternion;
        const currentAnimation = character.currentAction ? character.currentAction.getClip().name.toLowerCase() : "";


        const positionChanged = currentPosition.distanceToSquared(lastSent.position) > thresholds.position * thresholds.position;
        const rotationChanged = !currentQuaternion.equals(lastSent.quaternion);
        const animationChanged = currentAnimation !== lastSent.animation;

        if (positionChanged || rotationChanged || animationChanged) {
            const movementData = {
                x: currentPosition.x,
                y: currentPosition.z,
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

function main() {
    const token = localStorage.getItem('token');
    const characterData = localStorage.getItem('selectedCharacter');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    if (!characterData) {
        window.location.href = '/character-selection';
        return;
    }

    const character = JSON.parse(characterData);
    initializeGame(token, character);
}

window.addEventListener("DOMContentLoaded", main);
