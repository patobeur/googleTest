const worldItems = [];
let itemCounter = 0;
const itemTypes = ["wood", "stone", "iron"];

function spawnCube(io) {
	itemCounter++;
	const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
	const item = {
		id: itemCounter,
		type: type,
		x: Math.floor(Math.random() * 20) - 10,
		y: 0.5,
		z: Math.floor(Math.random() * 20) - 10,
	};
	worldItems.push(item);
	io.emit("itemSpawned", item);
}

function init(io) {
    setInterval(() => spawnCube(io), 5000);
}

module.exports = {
    init,
    worldItems,
};
