const User = require('./user');
const Character = require('./character');
const Inventory = require('./inventory.model');
const { registerInventoryHandlers } = require("./inventory");

const players = {}; // In-memory store for active players

function handleNewPlayer(io, socket, worldItems) {
	console.log(`Player connecting with userId: ${socket.userId} and characterId: ${socket.characterId}`);

	// Fetch user, character, and inventory data in parallel
	Promise.all([
		new Promise((resolve, reject) => User.getUserById(socket.userId, (err, user) => err ? reject(err) : resolve(user))),
		new Promise((resolve, reject) => Character.getCharacterById(socket.characterId, (err, character) => err ? reject(err) : resolve(character))),
		new Promise((resolve, reject) => Inventory.getInventory(socket.characterId, (err, inventory) => err ? reject(err) : resolve(inventory)))
	]).then(([user, character, inventory]) => {
		if (!user || !character) {
			throw new Error(`User or Character not found. User: ${!!user}, Character: ${!!character}`);
		}

		// Security check: ensure the character belongs to the user
		if (character.user_id !== user.id) {
			throw new Error(`Character ${character.id} does not belong to user ${user.id}`);
		}

		// Create the in-game player object from the character data
		const player = {
			id: socket.id, // The ephemeral socket ID
			characterId: character.id,
			userId: user.id,
			name: user.username, // Use username from the users table
			x: character.x,
			y: character.y,
			z: character.z,
			rotation: { x: 0, y: 0, z: 0, w: 1 },
			animation: "idle",
			inventory: inventory, // Load inventory from DB
			level: character.level,
			health: character.health,
			mana: character.mana,
			model: character.model,
			gender: character.gender,
			color: character.color,
		};

		players[socket.id] = player;

		socket.emit("currentState", players);
		socket.emit("worldItems", worldItems);
		socket.broadcast.emit("newPlayer", player);

	}).catch(err => {
		console.error("Error during player initialization:", err);
		socket.disconnect(true); // Disconnect client if data can't be loaded
	});
}

function handlePlayerDisconnection(io, socket) {
	console.log("Player disconnected:", socket.id);
	const player = players[socket.id];
	if (player) {
		// Save the player's state back to the database
		const characterDataToSave = {
			id: player.characterId,
			level: player.level,
			health: player.health,
			mana: player.mana,
			x: player.x,
			y: player.y,
			z: player.z,
		};
		Character.updateCharacterState(characterDataToSave, (err) => {
			if (err) {
				console.error(`Failed to save state for character ${player.characterId}:`, err);
			} else {
				console.log(`Successfully saved state for character ${player.characterId}.`);
			}
		});
		delete players[socket.id];
	}
	io.emit("playerDisconnected", socket.id);
}

function handlePlayerMovement(io, socket, movementData) {
	const player = players[socket.id];
	if (!player) return;

	// Basic anti-cheat/validation can be done here
	player.x = movementData.x;
	player.y = movementData.y; // In our 3D world, the server's 'y' is the client's 'z'
	player.rotation = movementData.rotation;
	player.animation = movementData.animation;

	// We don't save position on every move, only on disconnect, but broadcast to others
	io.emit("playerMoved", player);
}

function init(io, worldItems) {
	io.on("connection", (socket) => {
		handleNewPlayer(io, socket, worldItems);

		socket.on("disconnect", () => handlePlayerDisconnection(io, socket));

		socket.on("playerMovement", (movementData) =>
			handlePlayerMovement(io, socket, movementData)
		);

		// Register inventory handlers for the connected socket
		registerInventoryHandlers(io, socket, players, worldItems);
	});
}

module.exports = { init };
