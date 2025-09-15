const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    // Création de la table des utilisateurs
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        resetPasswordToken TEXT,
        resetPasswordExpires INTEGER
    )`);

    // Création de la table des personnages
    db.run(`CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT,
        class TEXT,
        gender TEXT,
        model TEXT,
        color TEXT,
        level INTEGER,
        health INTEGER,
        mana INTEGER,
        x REAL,
        y REAL,
        z REAL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Création de la table de l'inventaire
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id INTEGER NOT NULL,
        slot_index INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id),
        UNIQUE(character_id, slot_index)
    )`);
});

module.exports = db;
