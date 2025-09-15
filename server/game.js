const jwt = require("jsonwebtoken");
const world = require("./world");
const player = require("./player");

const jwtSecret = process.env.JWT_SECRET;

function initGame(io) {
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
			const characterId = socket.handshake.auth.characterId;
			if (!characterId) {
				return next(new Error("Missing characterId"));
			}
			socket.userId = decoded.userId;
			socket.characterId = characterId;
			next();
		});
	});

    // Initialiser les modules de jeu
    world.init(io);
    player.init(io, world.worldItems);
}

module.exports = { initGame };
