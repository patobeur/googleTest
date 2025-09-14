// server/server.js
require('dotenv').config();

const requiredEnvVars = ['JWT_SECRET', 'SMTP_PASS'];
for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        console.error(`Error: Missing required environment variable '${varName}'.`);
        console.error("Please create a .env file with the required variables.");
        process.exit(1);
    }
}
const http = require("http");
const path = require("path");
const express = require("express");
const socketIO = require("socket.io");
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const { initGame } = require("./game.js");
require("./db.js"); // This will run the db serialization logic

const app = express();
const jwtSecret = process.env.JWT_SECRET;
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Servir les fichiers statiques du client
const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath));

// Route pour la page d'accueil
app.get("/", (req, res) => {
	res.sendFile(path.join(clientPath, "index.html"));
});

// Routes d'authentification
const authRoutes = require("./auth");
app.use("/auth", authRoutes);

// Middleware d'authentification JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};

// API pour les personnages
const { getCharactersByUserId, createCharacter } = require("./character");

// Récupérer les personnages de l'utilisateur authentifié
app.get("/api/characters", authenticateJWT, (req, res) => {
    const userId = req.user.userId;
	getCharactersByUserId(userId, (err, characters) => {
		if (err) {
			return res
				.status(500)
				.json({ message: "Erreur du serveur lors de la récupération des personnages." });
		}
		res.json(characters);
	});
});

// Créer un nouveau personnage pour l'utilisateur authentifié
app.post("/api/characters", authenticateJWT, (req, res) => {
    const userId = req.user.userId;
	const { name, class: className, gender, model, color } = req.body;

	if (!name || !className || !gender || !model || !color) {
		return res
			.status(400)
			.json({ message: "Name, class, gender, model, and color are required." });
	}

	const characterData = { name, class: className, gender, model, color };
	createCharacter(characterData, userId, (err, newCharacter) => {
		if (err) {
			return res
				.status(500)
				.json({ message: "Erreur du serveur lors de la création du personnage." });
		}
		res.status(201).json(newCharacter);
	});
});


// API pour lister les modèles de personnages disponibles
app.get("/api/character-models", authenticateJWT, (req, res) => {
    const fs = require('fs');
    const toonDir = path.join(__dirname, '../client/toon');

    fs.readdir(toonDir, (err, files) => {
        if (err) {
            console.error("Could not list the directory.", err);
            return res.status(500).json({ message: "Error listing character models." });
        }

        const glbFiles = files.filter(file => path.extname(file).toLowerCase() === '.glb');
        res.json(glbFiles);
    });
});

// Initialiser la logique de jeu en lui passant l'instance io
initGame(io);

server.listen(PORT, () => {
	console.log(
		`Le serveur de jeu est lancé sur le port http://localhost:${PORT}`
	);
});
