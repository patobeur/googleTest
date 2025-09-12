const { updatePlayer } = require("./db");

function registerInventoryHandlers(io, socket, players, worldItems) {
    socket.on("pickupItem", (itemId) => {
        const player = players[socket.id];
        if (!player) return;

        const itemIndex = worldItems.findIndex((item) => item.id === itemId);
        if (itemIndex === -1) return;

        if (player.inventory.length >= 200) {
            return; // Inventory is full
        }

        const item = worldItems[itemIndex];
        const distance = Math.sqrt(
            Math.pow(player.x - item.x, 2) + Math.pow(player.y - item.z, 2)
        );

        if (distance < 2) {
            player.inventory.push(item);
            worldItems.splice(itemIndex, 1);
            io.emit("itemPickedUp", itemId);
            updatePlayer(player);
            socket.emit("inventoryUpdate", player.inventory);
        }
    });

    socket.on("dropItem", (item) => {
        const player = players[socket.id];
        if (!player) return;

        const itemIndex = player.inventory.findIndex((i) => i.id === item.id);
        if (itemIndex === -1) return;

        const droppedItem = player.inventory.splice(itemIndex, 1)[0];
        droppedItem.x = player.x;
        droppedItem.y = 0.5;
        droppedItem.z = player.y; // Player's y is on the z axis in 3D space
        worldItems.push(droppedItem);
        io.emit("itemSpawned", droppedItem);
        updatePlayer(player);
        socket.emit("inventoryUpdate", player.inventory);
    });
}

module.exports = {
    registerInventoryHandlers,
};
