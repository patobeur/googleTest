import * as THREE from "three";
import { Character } from "./Character.js";
import { ThirdPersonController } from "./ThirdPersonController.js";

const players = {};
let scene;
let camera;
let localPlayerId = null;
let thirdPersonController = null;

function initManager(s, c) {
    scene = s;
    camera = c;
}

function getLocalPlayer() {
    if (localPlayerId && players[localPlayerId]) {
        return players[localPlayerId];
    }
    return null;
}

function getThirdPersonController() {
    return thirdPersonController;
}

function setLocalPlayerId(id) {
    localPlayerId = id;
}

function addPlayer(playerInfo) {
    // FIX: Use the model field directly from the server data.
    const modelUrl = `/toon/${playerInfo.model}`;

    const isLocal = playerInfo.id === localPlayerId;

    const character = new Character(scene, {
        isLocal: isLocal,
        onLoadCallback: (loadedCharacter) => {
            loadedCharacter.setPosition(playerInfo.x, 0, playerInfo.y); // Use Y from server as Z

            // Create name label
            const nameLabel = document.createElement("div");
            nameLabel.className = "name-label";
            // FIX: Ensure the name is used for the label.
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

function update(deltaTime) {
    if (thirdPersonController) {
        thirdPersonController.update(deltaTime);
    }

    for (const id in players) {
        const player = players[id];
        if (player.character) {
            player.character.update(deltaTime);

            // Update name label position
            if (player.nameLabel && player.character.model) {
                const modelPosition = player.character.model.position.clone();
                modelPosition.y += 2.5; // Adjust this value to position the label above the head

                // Project 3D position to 2D screen space
                modelPosition.project(camera);

                const x = (modelPosition.x * .5 + .5) * window.innerWidth;
                const y = (modelPosition.y * -.5 + .5) * window.innerHeight;

                player.nameLabel.style.transform = `translate(-50%, -100%)`;
                player.nameLabel.style.left = `${x}px`;
                player.nameLabel.style.top = `${y}px`;
            }
        }
    }
}

export const PlayerManager = {
    initManager,
    addPlayer,
    updatePlayerPosition,
    removePlayer,
    setLocalPlayerId,
    getLocalPlayer,
    getThirdPersonController,
    update
};
