const jwt = require("jsonwebtoken");
const world = require("./world");
const player = require("./player");

const jwtSecret = process.env["SMTP_PASS"];

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
			socket.userId = decoded.userId;
			next();
		});
	});

    // Initialiser les modules de jeu
    world.init(io);
    player.init(io, world.worldItems);
}

module.exports = { initGame };
