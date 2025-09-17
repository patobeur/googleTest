const world = require("./world");
const player = require("./player");

function onPlayerConnected(socket) {
    player.onPlayerConnected(socket, world.worldItems);
}

function onPlayerDisconnected(socket) {
    player.onPlayerDisconnected(socket);
}

function onPlayerMovement(socket, movementData) {
    player.onPlayerMovement(socket, movementData);
}

function onPickupItem(io, socket, itemId) {
    player.onPickupItem(io, socket, itemId);
}

function onDropItem(socket, slotIndex) {
    player.onDropItem(socket, slotIndex);
}

function onMoveItem(socket, { fromIndex, toIndex }) {
    player.onMoveItem(socket, { fromIndex, toIndex });
}


module.exports = {
    onPlayerConnected,
    onPlayerDisconnected,
    onPlayerMovement,
    onPickupItem,
    onDropItem,
    onMoveItem
};
