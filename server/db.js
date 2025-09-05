const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

// Configure the database
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

// Set default data
async function initializeDatabase() {
    await db.read();
    db.data = db.data || { users: [], players: [] };
    await db.write();
}

// User functions
async function getUserByEmail(email) {
    await db.read();
    return db.data.users.find(user => user.email === email);
}

async function createUser(user) {
    await db.read();
    db.data.users.push(user);
    await db.write();
}

async function updateUser(user) {
    await db.read();
    const index = db.data.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        db.data.users[index] = user;
        await db.write();
    }
}

async function getUserByResetToken(token) {
    await db.read();
    return db.data.users.find(user => user.resetPasswordToken === token && user.resetPasswordExpires > Date.now());
}


// Player functions
async function getPlayerByUserId(userId) {
    await db.read();
    return db.data.players.find(player => player.userId === userId);
}

async function createPlayer(player) {
    await db.read();
    db.data.players.push(player);
    await db.write();
}

async function updatePlayer(player) {
    await db.read();
    const index = db.data.players.findIndex(p => p.id === player.id);
    if (index !== -1) {
        db.data.players[index] = player;
        await db.write();
    }
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
