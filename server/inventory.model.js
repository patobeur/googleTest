const db = require('./db');

/**
 * Fetches the inventory for a given character and returns it as a 40-slot array.
 * @param {number} characterId - The ID of the character.
 * @param {function(Error, Array)} callback - Callback with the inventory array.
 */
function getInventory(characterId, callback) {
    const sql = "SELECT * FROM inventory WHERE character_id = ?";
    db.all(sql, [characterId], (err, rows) => {
        if (err) {
            return callback(err);
        }
        // Initialize a 40-slot inventory with nulls
        const inventory = Array(40).fill(null);
        // Populate the array with items from the database
        rows.forEach(row => {
            inventory[row.slot_index] = {
                type: row.item_type,
                quantity: row.quantity
            };
        });
        callback(null, inventory);
    });
}

/**
 * Saves the entire inventory state for a character to the database.
 * @param {number} characterId - The ID of the character.
 * @param {Array} inventory - The 40-slot inventory array.
 * @param {function(Error)} callback - Callback to signal completion.
 */
function saveInventory(characterId, inventory, callback) {
    const deleteSql = "DELETE FROM inventory WHERE character_id = ?";

    db.serialize(() => {
        db.run(deleteSql, [characterId], (err) => {
            if (err) {
                return callback(err);
            }

            const insertSql = `INSERT INTO inventory (character_id, slot_index, item_type, quantity) VALUES (?, ?, ?, ?)`;
            const stmt = db.prepare(insertSql);

            inventory.forEach((item, index) => {
                if (item) { // Only save non-null slots
                    stmt.run(characterId, index, item.type, item.quantity);
                }
            });

            stmt.finalize(callback);
        });
    });
}

module.exports = {
    getInventory,
    saveInventory
};
