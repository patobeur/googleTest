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
    // Using a serialized block to ensure statements run in order.
    db.serialize(() => {
        // Start the transaction.
        db.run("BEGIN TRANSACTION;");

        // Delete the old inventory for the character.
        db.run("DELETE FROM inventory WHERE character_id = ?", [characterId]);

        // Prepare the insert statement once.
        const stmt = db.prepare("INSERT INTO inventory (character_id, slot_index, item_type, quantity) VALUES (?, ?, ?, ?)");

        // Loop through the inventory and run an insert for each non-null item.
        for (let i = 0; i < inventory.length; i++) {
            const item = inventory[i];
            if (item) {
                stmt.run(characterId, i, item.type, item.quantity);
            }
        }

        // Finalize the prepared statement.
        stmt.finalize();

        // Commit the transaction. The callback will be executed after the commit.
        // If any statement above failed, the transaction will be rolled back by the database
        // or the commit will fail, and the error will be passed to the callback.
        db.run("COMMIT;", function(err) {
            if (err) {
                // If commit fails, explicitly try to rollback.
                console.error("Commit failed, attempting to roll back.", err);
                db.run("ROLLBACK;");
                callback(err);
            } else {
                callback(null);
            }
        });
    });
}

module.exports = {
    getInventory,
    saveInventory
};
