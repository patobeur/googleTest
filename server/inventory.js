const Inventory = require('./inventory.model');
const { respawnItem } = require("./world");

const MAX_STACK_SIZE = 64;

function saveAndSyncInventory(io, socket, player) {
    Inventory.saveInventory(player.characterId, player.inventory, (err) => {
        if (err) {
            console.error(`Failed to save inventory for character ${player.characterId}:`, err);
            socket.emit("infoMessage", "Error: Could not save inventory.");
            return;
        }
        console.log(`Inventory saved for character ${player.characterId}. Syncing with client.`);
        socket.emit("inventoryUpdate", player.inventory);
    });
}

function registerInventoryHandlers(io, socket, players, worldItems) {
	socket.on("pickupItem", (itemId) => {
		const player = players[socket.id];
		if (!player) return;

		const itemIndexInWorld = worldItems.findIndex((item) => item.id === itemId);
		if (itemIndexInWorld === -1) {
            console.log(`Player ${player.name} tried to pick up non-existent item ${itemId}`);
            return;
        }

		const item = worldItems[itemIndexInWorld];
		const distance = Math.sqrt(
			Math.pow(player.x - item.x, 2) + Math.pow(player.y - item.z, 2)
		);

        console.log(`Player ${player.name} attempting to pick up ${item.type} at distance ${distance.toFixed(2)}`);

		if (distance > 2) {
            console.log(`Pickup failed: too far.`);
            socket.emit("infoMessage", "Too far away to pick up.");
            return;
        }

		// 1. Try to stack with existing items
		for (let i = 0; i < player.inventory.length; i++) {
			const slot = player.inventory[i];
			if (slot && slot.type === item.type && slot.quantity < MAX_STACK_SIZE) {
                console.log(`Stacking ${item.type} in slot ${i}`);
				slot.quantity++;
                const pickedUpItemType = worldItems[itemIndexInWorld].type;
				worldItems.splice(itemIndexInWorld, 1);
				io.emit("itemPickedUp", itemId);
                respawnItem(pickedUpItemType);
				saveAndSyncInventory(io, socket, player);
				return;
			}
		}

		// 2. Find an empty slot
		const emptySlotIndex = player.inventory.findIndex((slot) => slot === null);
		if (emptySlotIndex !== -1) {
            console.log(`Placing ${item.type} in new slot ${emptySlotIndex}`);
			player.inventory[emptySlotIndex] = { type: item.type, quantity: 1 };
            const pickedUpItemType = worldItems[itemIndexInWorld].type;
			worldItems.splice(itemIndexInWorld, 1);
			io.emit("itemPickedUp", itemId);
            respawnItem(pickedUpItemType);
			saveAndSyncInventory(io, socket, player);
			return;
		}

        console.log(`Pickup failed: inventory full.`);
		socket.emit("infoMessage", "L'inventaire est plein.");
	});

	socket.on("dropItem", (slotIndex) => {
		console.log('drop item')
		const player = players[socket.id];
		if (!player || slotIndex < 0 || slotIndex >= player.inventory.length) return;

		const slot = player.inventory[slotIndex];
		if (!slot) return;

		const droppedItem = {
			id: `item-${Date.now()}-${Math.random()}`,
			type: slot.type,
			x: player.x,
			y: 0.5,
			z: player.y,
		};

		worldItems.push(droppedItem);
		io.emit("itemSpawned", droppedItem);

		slot.quantity--;
		if (slot.quantity <= 0) {
			player.inventory[slotIndex] = null;
		}

		saveAndSyncInventory(io, socket, player);
	});

	socket.on("moveItem", ({ fromIndex, toIndex }) => {
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

		saveAndSyncInventory(io, socket, player);
	});
}

module.exports = {
	registerInventoryHandlers,
};
