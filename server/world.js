const worldItems = [];
let itemCounter = 0;
const itemTypes = ["wood", "stone", "herb", "iron"];

const itemTypes2 = {
    wood: { model: 'models/ressources/Wood.glb', scale: 0.1, color: 0x8B4513 }, // Brown
    stone: { model: 'models/ressources/Rock.glb', scale: 0.05, color: 0x808080 }, // Grey
    herb: { model: 'models/ressources/Plant.glb', scale: 0.2, color: 0x00ff00 }, // Green
    iron: { model: 'models/ressources/Rock Medium.glb', scale: 0.05, color: 0x43464B }, // Dark Grey
};

let io;

const MAX_ITEMS_PER_TYPE = 5;
const RESPAWN_DELAY = 500000; // 500 seconds

function spawnItem(type) {
    itemCounter++;

    const item = {
        id: itemCounter,
        type: type,
        x: Math.floor(Math.random() * 50) - 25,
        y: 0.5,
        z: Math.floor(Math.random() * 50) - 25,
    };
    worldItems.push(item);
    return item;
}

function respawnItem(type) {
    setTimeout(() => {
        const newItem = spawnItem(type);
        if (io) {
            io.emit("itemSpawned", newItem);
            console.log(`Respawned a ${type}.`);
        }
    }, RESPAWN_DELAY);
}

function init(socketIo) {
    io = socketIo;
    // Initial spawn
    itemTypes.forEach(type => {
        for (let i = 0; i < MAX_ITEMS_PER_TYPE; i++) {
            spawnItem(type);
        }
    });
    console.log(`Initial world populated with ${worldItems.length} items.`);
}

module.exports = {
    init,
    worldItems,
    respawnItem,
};
