const jwt = require("jsonwebtoken");
const {
	getPlayerByUserId,
	createPlayer,
	updatePlayer,
	getUserById,
} = require("./db");
const jwtSecret = "supersecretkey"; // In a real app, use an environment variable

const worldItems = [];
let itemCounter = 0;
const itemTypes = ["wood", "stone", "iron"];

function spawnCube(io) {
	itemCounter++;
	const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
	const item = {
		id: itemCounter,
		type: type,
		x: Math.floor(Math.random() * 20) - 10,
		y: 0.5,
		z: Math.floor(Math.random() * 20) - 10,
	};
	worldItems.push(item);
	io.emit("itemSpawned", item);
}

function initGame(io) {
	const players = {};

	// Middleware d'authentification Socket.IO
	io.use((socket, next) => {
		const token = socket.handshake.auth.token;
		if (!token) {
			return next(new Error("Authentication error"));
		}
		jwt.verify(token, jwtSecret, (err, decoded) => {
			if (err) {
				return next(new Error("Authentication error"));
			}
			socket.userId = decoded.userId;
			next();
		});
	});

	io.on("connection", (socket) => {
		console.log(
			"Un nouveau joueur est connecté:",
			socket.id,
			"avec le userId:",
			socket.userId
		);

		const user = getUserById(socket.userId);
		if (!user) {
			console.error("User not found for userId:", socket.userId);
			return; // Or handle appropriately
		}

		let player = getPlayerByUserId(socket.userId);
		if (!player) {
			player = {
				id: socket.id,
				userId: socket.userId,
				name: user.name, // Add name here
				x: Math.floor(Math.random() * 10) - 5,
				y: Math.floor(Math.random() * 10) - 5,
				color: `hsl(${Math.random() * 360}, 100%, 50%)`,
				rotation: { x: 0, y: 0, z: 0, w: 1 },
				animation: "idle",
				inventory: [],
			};
			createPlayer(player);
		} else {
			player.id = socket.id; // Update socket id
			player.name = user.name; // Ensure name is up-to-date
			if (!player.rotation) player.rotation = { x: 0, y: 0, z: 0, w: 1 };
			if (!player.animation) player.animation = "idle";
			if (!player.inventory) player.inventory = [];
		}

		players[socket.id] = player;

		socket.emit("currentState", players);
		socket.emit("worldItems", worldItems);
		socket.broadcast.emit("newPlayer", player);

		socket.on("disconnect", () => {
			console.log("Un joueur s'est déconnecté:", socket.id);
			updatePlayer(players[socket.id]);
			delete players[socket.id];
			io.emit("playerDisconnected", socket.id);
		});

		socket.on("playerMovement", (movementData) => {
			const player = players[socket.id];
			if (!player) return;

			const lastPosition = { x: player.x, y: player.y };
			const newPosition = { x: movementData.x, y: movementData.y };

			// Basic anti-cheat
			const distanceSq =
				Math.pow(newPosition.x - lastPosition.x, 2) +
				Math.pow(newPosition.y - lastPosition.y, 2);

			const MAX_SPEED = 15; // Increased from 5
			const TICK_RATE = 10; // Client sends updates every 100ms (10Hz)
			const TOLERANCE_FACTOR = 1.5;
			const MAX_DISTANCE_PER_TICK =
				(MAX_SPEED / TICK_RATE) * TOLERANCE_FACTOR;
			const MAX_DISTANCE_SQ = MAX_DISTANCE_PER_TICK * MAX_DISTANCE_PER_TICK;

			if (distanceSq <= MAX_DISTANCE_SQ) {
				player.x = newPosition.x;
				player.y = newPosition.y;
				player.rotation = movementData.rotation;
				player.animation = movementData.animation;

				// Save data on every move
				updatePlayer(player);

				io.emit("playerMoved", player);
			} else {
				console.log(
					`Invalid movement detected for player ${
						socket.id
					}. Dist sq: ${distanceSq.toFixed(2)} > ${MAX_DISTANCE_SQ.toFixed(
						2
					)}`
				);
				socket.emit("correction", { x: player.x, y: player.y });
			}
		});

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
	});

	setInterval(() => spawnCube(io), 5000); // Spawn a new cube every 5 seconds
}

module.exports = { initGame };
