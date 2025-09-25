// server/server.js
require("dotenv").config();

<<<<<<< HEAD
const requiredEnvVars = ["JWT_SECRET"];
=======
const requiredEnvVars = ['JWT_SECRET'];
>>>>>>> ae1a1b390234f774ea9c39d50385a0747017c8c6
for (const varName of requiredEnvVars) {
	if (!process.env[varName]) {
		console.error(
			`Error: Missing required environment variable '${varName}'.`
		);
		console.error("Please create a .env file with the required variables.");
		process.exit(1);
	}
}
const http = require("http");
const path = require("path");
const express = require("express");
const socketIO = require("socket.io");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { initSocketEvents } = require("./socket-events.js");
const world = require("./world.js");
require("./db.js"); // This will run the db serialization logic

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

world.init(io);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Servir les fichiers statiques du client
const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

// Routes pour les pages HTML
app.get("/", (req, res) => {
	res.sendFile(path.join(clientPath, "index.html"));
});

app.get("/login", (req, res) => {
	res.sendFile(path.join(clientPath, "login.html"));
});

app.get("/character-selection", (req, res) => {
	res.sendFile(path.join(clientPath, "character-selection.html"));
});

app.get("/game", (req, res) => {
	res.sendFile(path.join(clientPath, "game.html"));
});

// Routes d'authentification
const authRoutes = require("./auth");
app.use("/auth", authRoutes);

// API routes
const characterRoutes = require("./routes/character.routes.js");
app.use("/api", characterRoutes);

// Initialiser la logique de jeu en lui passant l'instance io
initSocketEvents(io);

server.listen(PORT, () => {
	console.log(
		`Le serveur de jeu est lancé sur le port http://localhost:${PORT}`
	);
});
