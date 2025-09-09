const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Configure the database
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set default data
function initializeDatabase() {
    db.defaults({ users: [], players: [] }).write();
}

// User functions
function getUserByEmail(email) {
    return db.get('users').find({ email }).value();
}

function createUser(user) {
    db.get('users').push(user).write();
}

function updateUser(user) {
    db.get('users').find({ id: user.id }).assign(user).write();
}

function getUserByResetToken(token) {
    const user = db.get('users').find({ resetPasswordToken: token }).value();
    if (user && user.resetPasswordExpires > Date.now()) {
        return user;
    }
    return null;
}

// Player functions
function getPlayerByUserId(userId) {
    return db.get('players').find({ userId }).value();
}

function createPlayer(player) {
    db.get('players').push(player).write();
}

function updatePlayer(player) {
    if (!player || !player.userId) {
        console.error("Attempted to update a player without a userId.", player);
        return;
    }
    const { id, ...playerData } = player; // Don't save the ephemeral socket.id
    db.get('players').find({ userId: player.userId }).assign(playerData).write();
}

module.exports = {
    initializeDatabase,
    getUserByEmail,
    createUser,
    updateUser,
    getUserByResetToken,
    getPlayerByUserId,
    createPlayer,
    updatePlayer,
    db
};
