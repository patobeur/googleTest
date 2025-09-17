const Player = require('./entities/player');
const Character = require('./character');
const Inventory = require('./inventory.model');
const world = require('./world');

const players = {}; // In-memory store for active players

function onPlayerConnected(socket, worldItems) {
    console.log(`Player connecting with userId: ${socket.userId} and characterId: ${socket.characterId}`);

    // Fetch character and inventory data in parallel
    Promise.all([
        new Promise((resolve, reject) => Character.getCharacterById(socket.characterId, (err, character) => err ? reject(err) : resolve(character))),
        new Promise((resolve, reject) => Inventory.getInventory(socket.characterId, (err, inventory) => err ? reject(err) : resolve(inventory)))
    ]).then(([character, inventory]) => {
        if (!character) {
            throw new Error(`Character not found.`);
        }

        // Security check: ensure the character belongs to the user
        if (character.user_id !== socket.userId) {
            throw new Error(`Character ${character.id} does not belong to user ${socket.userId}`);
        }

        const player = new Player(socket, { ...character, inventory });
        players[socket.id] = player;

        const allPlayersState = Object.values(players).map(p => p.getState());
        socket.emit("currentState", allPlayersState);
        socket.emit("worldItems", worldItems);
        socket.broadcast.emit("newPlayer", player.getState());

    }).catch(err => {
        console.error("Error during player initialization:", err);
        socket.disconnect(true); // Disconnect client if data can't be loaded
    });
}

function onPlayerDisconnected(socket) {
    console.log("Player disconnected:", socket.id);
    const player = players[socket.id];
    if (player) {
        // Save the player's state back to the database
        const characterDataToSave = {
            id: player.characterId,
            x: player.x,
            y: player.y,
            z: player.z,
            level: player.level,
            health: player.health,
            mana: player.mana,
        };
        Character.updateCharacterState(characterDataToSave, (err) => {
            if (err) {
                console.error(`Failed to save state for character ${player.characterId}:`, err);
            } else {
                console.log(`Successfully saved state for character ${player.characterId}.`);
            }
        });
        Inventory.saveInventory(player.characterId, player.inventory, (err) => {
            if (err) {
                console.error(`Failed to save inventory for character ${player.characterId}:`, err);
            } else {
                console.log(`Successfully saved inventory for character ${player.characterId}.`);
            }
        });
        delete players[socket.id];
    }
    socket.broadcast.emit("playerDisconnected", socket.id);
}

function onPlayerMovement(socket, movementData) {
    const player = players[socket.id];
    if (!player) return;

    player.move(movementData);

    // Broadcast updated state to other players
    socket.broadcast.emit("playerMoved", player.getState());
}

const { respawnItem } = require("./world");
const MAX_STACK_SIZE = 64;

function saveAndSyncInventory(socket, player) {
    Inventory.saveInventory(player.characterId, player.inventory, (err) => {
        if (err) {
            console.error(`Failed to save inventory for character ${player.characterId}:`, err);
            socket.emit("infoMessage", "Error: Could not save inventory.");
            return;
        }
        socket.emit("inventoryUpdate", player.inventory);
    });
}

function onPickupItem(socket, itemId) {
    const player = players[socket.id];
    if (!player) return;

    const itemIndexInWorld = world.worldItems.findIndex((item) => item.id === itemId);
    if (itemIndexInWorld === -1) return;

    const item = world.worldItems[itemIndexInWorld];
    const distance = Math.sqrt(
        Math.pow(player.x - item.x, 2) + Math.pow(player.y - item.z, 2)
    );

    if (distance > 2) {
        socket.emit("infoMessage", "Too far away to pick up.");
        return;
    }

    // 1. Try to stack with existing items
    for (let i = 0; i < player.inventory.length; i++) {
        const slot = player.inventory[i];
        if (slot && slot.type === item.type && slot.quantity < MAX_STACK_SIZE) {
            slot.quantity++;
            const pickedUpItemType = world.worldItems[itemIndexInWorld].type;
            world.worldItems.splice(itemIndexInWorld, 1);
            socket.broadcast.emit("itemPickedUp", itemId);
            socket.emit("itemPickedUp", itemId);
            respawnItem(pickedUpItemType);
            saveAndSyncInventory(socket, player);
            return;
        }
    }

    // 2. Find an empty slot
    const emptySlotIndex = player.inventory.findIndex((slot) => slot === null);
    if (emptySlotIndex !== -1) {
        player.inventory[emptySlotIndex] = { type: item.type, quantity: 1 };
        const pickedUpItemType = world.worldItems[itemIndexInWorld].type;
        world.worldItems.splice(itemIndexInWorld, 1);
        socket.broadcast.emit("itemPickedUp", itemId);
        socket.emit("itemPickedUp", itemId);
        respawnItem(pickedUpItemType);
        saveAndSyncInventory(socket, player);
        return;
    }

    socket.emit("infoMessage", "L'inventaire est plein.");
}

function onDropItem(socket, slotIndex) {
    const player = players[socket.id];
    if (!player || slotIndex < 0 || slotIndex >= player.inventory.length) return;

    const slot = player.inventory[slotIndex];
    if (!slot) return;

    world.addItemToWorld(slot, { x: player.x, y: player.y, z: player.z });

    slot.quantity--;
    if (slot.quantity <= 0) {
        player.inventory[slotIndex] = null;
    }

    saveAndSyncInventory(socket, player);
}

function onMoveItem(socket, { fromIndex, toIndex }) {
    const player = players[socket.id];
    if (!player || fromIndex < 0 || fromIndex >= player.inventory.length || toIndex < 0 || toIndex >= player.inventory.length || fromIndex === toIndex) {
        return;
    }

    const fromSlot = player.inventory[fromIndex];
    const toSlot = player.inventory[toIndex];

    if (!fromSlot) return;

    if (toSlot === null) {
        player.inventory[toIndex] = fromSlot;
        player.inventory[fromIndex] = null;
    } else if (toSlot.type === fromSlot.type && toSlot.quantity < MAX_STACK_SIZE) {
        const canAdd = MAX_STACK_SIZE - toSlot.quantity;
        const amountToMove = Math.min(fromSlot.quantity, canAdd);
        toSlot.quantity += amountToMove;
        fromSlot.quantity -= amountToMove;
        if (fromSlot.quantity <= 0) {
            player.inventory[fromIndex] = null;
        }
    } else {
        player.inventory[toIndex] = fromSlot;
        player.inventory[fromIndex] = toSlot;
    }

    saveAndSyncInventory(socket, player);
}

module.exports = {
    onPlayerConnected,
    onPlayerDisconnected,
    onPlayerMovement,
    onPickupItem,
    onDropItem,
    onMoveItem
};
