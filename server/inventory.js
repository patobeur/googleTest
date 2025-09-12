const { updatePlayer } = require("./db");

const MAX_STACK_SIZE = 64;

function registerInventoryHandlers(io, socket, players, worldItems) {
	socket.on("pickupItem", (itemId) => {
		const player = players[socket.id];
		if (!player) return;

		const itemIndexInWorld = worldItems.findIndex((item) => item.id === itemId);
		if (itemIndexInWorld === -1) return;

		const item = worldItems[itemIndexInWorld];
		const distance = Math.sqrt(
			Math.pow(player.x - item.x, 2) + Math.pow(player.y - item.z, 2)
		);

		if (distance > 2) return;

		// --- New inventory logic ---

		// 1. Try to stack with existing items
		for (let i = 0; i < player.inventory.length; i++) {
			const slot = player.inventory[i];
			if (
				slot &&
				slot.item.type === item.type &&
				slot.quantity < MAX_STACK_SIZE
			) {
				slot.quantity++;
				worldItems.splice(itemIndexInWorld, 1);
				io.emit("itemPickedUp", itemId);
				updatePlayer(player);
				socket.emit("inventoryUpdate", player.inventory);
				return;
			}
		}

		// 2. Find an empty slot
		const emptySlotIndex = player.inventory.findIndex((slot) => slot === null);
		if (emptySlotIndex !== -1) {
			player.inventory[emptySlotIndex] = { item: item, quantity: 1 };
			worldItems.splice(itemIndexInWorld, 1);
			io.emit("itemPickedUp", itemId);
			updatePlayer(player);
			socket.emit("inventoryUpdate", player.inventory);
			return;
		}

		// 3. Inventory is full
		socket.emit("infoMessage", "L'inventaire est plein.");
	});

	socket.on("dropItem", (slotIndex) => {
		const player = players[socket.id];
		if (!player) return;

		if (slotIndex < 0 || slotIndex >= player.inventory.length) return;

		const slot = player.inventory[slotIndex];
		if (!slot) return;

		// Drop one item from the stack
		const droppedItem = { ...slot.item };
		droppedItem.id = `item-${Date.now()}-${Math.random()}`; // New unique ID
		droppedItem.x = player.x;
		droppedItem.y = 0.5;
		droppedItem.z = player.y; // Player's y is on the z axis in 3D space

		worldItems.push(droppedItem);
		io.emit("itemSpawned", droppedItem);

		slot.quantity--;
		if (slot.quantity <= 0) {
			player.inventory[slotIndex] = null;
		}

		updatePlayer(player);
		socket.emit("inventoryUpdate", player.inventory);
	});

	socket.on("moveItem", ({ fromIndex, toIndex }) => {
		const player = players[socket.id];
		if (!player) return;

		if (
			fromIndex < 0 ||
			fromIndex >= player.inventory.length ||
			toIndex < 0 ||
			toIndex >= player.inventory.length ||
			fromIndex === toIndex
		) {
			return;
		}

		const fromSlot = player.inventory[fromIndex];
		const toSlot = player.inventory[toIndex];

		if (!fromSlot) return;

		// Case 1: Moving to an empty slot
		if (toSlot === null) {
			player.inventory[toIndex] = fromSlot;
			player.inventory[fromIndex] = null;
		}
		// Case 2: Stacking with an existing item of the same type
		else if (
			toSlot.item.type === fromSlot.item.type &&
			toSlot.quantity < MAX_STACK_SIZE
		) {
			const canAdd = MAX_STACK_SIZE - toSlot.quantity;
			const amountToMove = Math.min(fromSlot.quantity, canAdd);

			toSlot.quantity += amountToMove;
			fromSlot.quantity -= amountToMove;

			if (fromSlot.quantity <= 0) {
				player.inventory[fromIndex] = null;
			}
		}
		// Case 3: Swapping two items
		else {
			player.inventory[toIndex] = fromSlot;
			player.inventory[fromIndex] = toSlot;
		}

		updatePlayer(player);
		socket.emit("inventoryUpdate", player.inventory);
	});
}

module.exports = {
	registerInventoryHandlers,
};
