const worldItems = [];
let itemCounter = 0;
const itemTypes = ["wood", "stone", "iron"];
let io;

const MAX_ITEMS_PER_TYPE = 10;
const RESPAWN_DELAY = 5000; // 5 seconds

function spawnItem(type) {
    itemCounter++;
    const item = {
        id: itemCounter,
        type: type,
        x: Math.floor(Math.random() * 20) - 10,
        y: 0.5,
        z: Math.floor(Math.random() * 20) - 10,
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
