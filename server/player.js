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

function onPickupItem(socket, itemId) {
    const player = players[socket.id];
    if (!player) return;

    const item = world.getItem(itemId);
    if (!item) return;

    const emptySlot = player.inventory.findIndex(slot => slot === null);
    if (emptySlot !== -1) {
        player.pickupItem(item, emptySlot);
        world.removeItem(itemId);

        socket.emit('inventoryUpdate', player.inventory);
        socket.broadcast.emit('itemPickedUp', itemId);
        socket.emit('itemPickedUp', itemId);
    }
}

function onDropItem(socket, slotIndex) {
    const player = players[socket.id];
    if (!player) return;

    const item = player.dropItem(slotIndex);
    if(item){
        world.spawnItem(item.name, { x: player.x, y: player.y });
        socket.emit('inventoryUpdate', player.inventory);
    }
}

function onMoveItem(socket, { fromIndex, toIndex }) {
    const player = players[socket.id];
    if (!player) return;

    player.moveItem(fromIndex, toIndex);
    socket.emit('inventoryUpdate', player.inventory);
}

module.exports = {
    onPlayerConnected,
    onPlayerDisconnected,
    onPlayerMovement,
    onPickupItem,
    onDropItem,
    onMoveItem
};
