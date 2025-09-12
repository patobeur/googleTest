const {
	getPlayerByUserId,
	createPlayer,
	updatePlayer,
	getUserById,
} = require("./db");
const { registerInventoryHandlers } = require("./inventory");

const players = {};
const genders = {
	0: "whatever",
	1: "man",
	2: "woman",
};
const archetypes = {
	0: "healer",
	1: "wizard",
	3: "warrior",
	4: "rogue",
};
const caracters = {
	0: { hp: 50, mana: 100 },
	1: { hp: 40, mana: 150 },
	3: { hp: 70, mana: 50 },
	4: { hp: 50, mana: 50 },
};

function handleNewPlayer(io, socket, worldItems) {
	console.log(
		"Un nouveau joueur est connecté:",
		socket.id,
		"avec le userId:",
		socket.userId
	);

	const user = getUserById(socket.userId);
	if (!user) {
		console.error("User not found for userId:", socket.userId);
		return;
	}

	let player = getPlayerByUserId(socket.userId);
	if (!player) {
		player = {
			id: socket.id,
			userId: socket.userId,
			name: user.name,
			x: Math.floor(Math.random() * 10) - 5,
			y: Math.floor(Math.random() * 10) - 5,
			color: `hsl(${Math.random() * 360}, 100%, 50%)`,
			rotation: { x: 0, y: 0, z: 0, w: 1 },
			animation: "idle",
			inventory: Array(40).fill(null),
			archetype: archetypes[0],
			gender: genders[0],
			stats: caracters[0],
			xp: 0,
			level: 0,
		};
		createPlayer(player);
	} else {
		player.id = socket.id;
		player.name = user.name;
		if (!player.rotation) player.rotation = { x: 0, y: 0, z: 0, w: 1 };
		if (!player.animation) player.animation = "idle";
		if (!player.inventory || player.inventory.length !== 40) {
			player.inventory = Array(40).fill(null);
		}
	}

	players[socket.id] = player;

	socket.emit("currentState", players);
	socket.emit("worldItems", worldItems);
	socket.broadcast.emit("newPlayer", player);
}

function handlePlayerDisconnection(io, socket) {
	console.log("Un joueur s'est déconnecté:", socket.id);
	if (players[socket.id]) {
		updatePlayer(players[socket.id]);
		delete players[socket.id];
	}
	io.emit("playerDisconnected", socket.id);
}

function handlePlayerMovement(io, socket, movementData) {
	const player = players[socket.id];
	if (!player) return;

	const lastPosition = { x: player.x, y: player.y };
	const newPosition = { x: movementData.x, y: movementData.y };

	const distanceSq =
		Math.pow(newPosition.x - lastPosition.x, 2) +
		Math.pow(newPosition.y - lastPosition.y, 2);

	const MAX_SPEED = 15;
	const TICK_RATE = 10;
	const TOLERANCE_FACTOR = 1.5;
	const MAX_DISTANCE_PER_TICK = (MAX_SPEED / TICK_RATE) * TOLERANCE_FACTOR;
	const MAX_DISTANCE_SQ = MAX_DISTANCE_PER_TICK * MAX_DISTANCE_PER_TICK;

	if (distanceSq <= MAX_DISTANCE_SQ) {
		player.x = newPosition.x;
		player.y = newPosition.y;
		player.rotation = movementData.rotation;
		player.animation = movementData.animation;

		updatePlayer(player);

		io.emit("playerMoved", player);
	} else {
		console.log(
			`Invalid movement detected for player ${
				socket.id
			}. Dist sq: ${distanceSq.toFixed(2)} > ${MAX_DISTANCE_SQ.toFixed(2)}`
		);
		socket.emit("correction", { x: player.x, y: player.y });
	}
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
