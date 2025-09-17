const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getCharactersByUserId, createCharacter } = require("../character");
const path = require("path");
const fs = require('fs');

const jwtSecret = process.env.JWT_SECRET;

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

// Récupérer les personnages de l'utilisateur authentifié
router.get("/characters", authenticateJWT, (req, res) => {
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
router.post("/characters", authenticateJWT, (req, res) => {
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
router.get("/character-models", authenticateJWT, (req, res) => {
    const toonDir = path.join(__dirname, '../../client/toon');

    fs.readdir(toonDir, (err, files) => {
        if (err) {
            console.error("Could not list the directory.", err);
            return res.status(500).json({ message: "Error listing character models." });
        }

        const glbFiles = files.filter(file => path.extname(file).toLowerCase() === '.glb');
        res.json(glbFiles);
    });
});

module.exports = router;
