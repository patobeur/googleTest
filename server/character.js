const db = require('./db');

/**
 * Récupère tous les personnages d'un utilisateur spécifique.
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {function(Error, Array)} callback - Le callback qui gère la réponse.
 */
function getCharactersByUserId(userId, callback) {
    const sql = "SELECT * FROM characters WHERE user_id = ?";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Erreur lors de la récupération des personnages:", err.message);
            return callback(err);
        }
        callback(null, rows);
    });
}

/**
 * Crée un nouveau personnage pour un utilisateur spécifique.
 * @param {object} characterData - Les données du personnage à créer (ex: { name, class }).
 * @param {number} userId - L'ID de l'utilisateur auquel le personnage sera associé.
 * @param {function(Error, object)} callback - Le callback qui gère la réponse.
 */
function createCharacter(characterData, userId, callback) {
    const { name, class: className, gender, model, color, level = 1, health = 100, mana = 50, x = 0, y = 0, z = 0 } = characterData;
    const sql = `INSERT INTO characters (user_id, name, class, gender, model, color, level, health, mana, x, y, z) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [userId, name, className, gender, model, color, level, health, mana, x, y, z], function(err) {
        if (err) {
            console.error("Erreur lors de la création du personnage:", err.message);
            return callback(err);
        }
        // Retourne le nouveau personnage avec son ID
        callback(null, { id: this.lastID, user_id: userId, ...characterData });
    });
}

function getCharacterById(id, callback) {
    const sql = "SELECT * FROM characters WHERE id = ?";
    db.get(sql, [id], callback);
}

function updateCharacterState(characterData, callback) {
    const { id, level, health, mana, x, y, z } = characterData;
    const sql = `UPDATE characters SET level = ?, health = ?, mana = ?, x = ?, y = ?, z = ? WHERE id = ?`;
    db.run(sql, [level, health, mana, x, y, z, id], callback);
}

/**
 * Récupère tous les personnages d'un utilisateur avec leur inventaire (limité à 20 objets).
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {function(Error, Array)} callback - Le callback qui gère la réponse.
 */
function getCharactersWithInventory(userId, callback) {
    const sql = `
        SELECT
            c.*,
            (
                SELECT GROUP_CONCAT(i.item_type || ':' || i.quantity, ';')
                FROM (
                    SELECT item_type, quantity
                    FROM inventory
                    WHERE character_id = c.id
                    ORDER BY slot_index
                    LIMIT 20
                ) i
            ) as inventory
        FROM characters c
        WHERE c.user_id = ?
    `;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Erreur lors de la récupération des personnages avec inventaire:", err.message);
            return callback(err);
        }
        // Parser la chaîne d'inventaire en un tableau d'objets
        rows.forEach(row => {
            if (row.inventory) {
                row.inventory = row.inventory.split(';').map(item => {
                    const [item_type, quantity] = item.split(':');
                    return { item_type, quantity: parseInt(quantity, 10) };
                });
            } else {
                row.inventory = [];
            }
        });
        callback(null, rows);
    });
}


module.exports = {
    getCharactersByUserId,
    createCharacter,
    getCharacterById,
    updateCharacterState,
    getCharactersWithInventory,
};
