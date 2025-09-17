// This file will handle all socket.io event listeners on the client.
import { PlayerManager } from "./player-manager.js";
import { ThreeScene } from "./three-scene.js";
import { UI } from "./ui.js";

let socket = null;

function initSocket(token, character) {
    socket = io({
        auth: {
            token,
            characterId: character.id,
        },
    });

    socket.on("connect", () => {
        const myId = socket.id;
        PlayerManager.setLocalPlayerId(myId);
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
                PlayerManager.addPlayer(playerInfo);

                if (id === PlayerManager.getLocalPlayerId()) {
                    UI.updateInventory(playerInfo.inventory);
                }
            }
        }
    });

    socket.on("newPlayer", (playerInfo) => {
        PlayerManager.addPlayer(playerInfo);
    });

    socket.on("playerMoved", (playerInfo) => {
        PlayerManager.updatePlayerPosition(playerInfo);
    });

    socket.on("playerDisconnected", (id) => {
        PlayerManager.removePlayer(id);
    });

    socket.on("correction", (lastValidPosition) => {
        const correctedPlayerInfo = { id: PlayerManager.getLocalPlayerId(), ...lastValidPosition };
        PlayerManager.updatePlayerPosition(correctedPlayerInfo);
    });

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
        const player = PlayerManager.getLocalPlayer();
        if (player) {
            player.inventory = inventory;
        }
        UI.updateInventory(inventory);
    });
}

function getSocket() {
    return socket;
}

export const SocketManager = {
    initSocket,
    getSocket,
};
