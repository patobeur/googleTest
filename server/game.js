const jwt = require("jsonwebtoken");
const { getPlayerByUserId, createPlayer, updatePlayer } = require("./db");
const jwtSecret = process.env["SMTP_PASS"]; // In a real app, use an environment variable

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

		let player = getPlayerByUserId(socket.userId);
		if (!player) {
			player = {
				id: socket.id,
				userId: socket.userId,
				x: Math.floor(Math.random() * 10) - 5,
				y: Math.floor(Math.random() * 10) - 5,
				color: `hsl(${Math.random() * 360}, 100%, 50%)`,
				rotation: { x: 0, y: 0, z: 0, w: 1 },
				animation: "idle",
			};
			createPlayer(player);
		} else {
			player.id = socket.id; // Update socket id
			if (!player.rotation) player.rotation = { x: 0, y: 0, z: 0, w: 1 };
			if (!player.animation) player.animation = "idle";
		}

		players[socket.id] = player;

		socket.emit("currentState", players);
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
	});
}

module.exports = { initGame };
