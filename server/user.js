const db = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

function getUserById(id, callback) {
    const sql = `SELECT id, username FROM users WHERE id = ?`;
    db.get(sql, [id], callback);
}

function getUserByEmail(email, callback) {
    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [email], callback);
}

function createUser(email, password, callback) {
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) { return callback(err); }
        const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
        db.run(sql, [email, hashedPassword], function(err) {
            if (err) { return callback(err); }
            callback(null, { id: this.lastID });
        });
    });
}

function updateUserResetToken(userId, token, expires, callback) {
    const sql = `UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?`;
    db.run(sql, [token, expires, userId], callback);
}

function findUserByResetToken(token, callback) {
    const sql = `SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > ?`;
    db.get(sql, [token, Date.now()], callback);
}

function updateUserPassword(userId, password, callback) {
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) { return callback(err); }
        const sql = `UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?`;
        db.run(sql, [hashedPassword, userId], callback);
    });
}

module.exports = {
    getUserById,
    getUserByEmail,
    createUser,
    updateUserResetToken,
    findUserByResetToken,
    updateUserPassword,
};
