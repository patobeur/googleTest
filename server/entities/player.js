class Player {
    constructor(socket, characterData) {
        this.socket = socket;
        this.id = socket.id;
        this.characterId = socket.characterId;
        this.userId = socket.userId;
        this.name = characterData.name;
        this.class = characterData.class;
        this.gender = characterData.gender;
        this.model = characterData.model;
        this.color = characterData.color;
        this.x = characterData.x || 0;
        this.y = characterData.y || 0;
        this.z = characterData.z || 0;
        this.rotation = characterData.rotation || { x: 0, y: 0, z: 0, w: 1 };
        this.animation = 'idle';
        this.inventory = characterData.inventory || Array(20).fill(null);
        this.level = characterData.level || 1;
        this.health = characterData.health || 100;
        this.mana = characterData.mana || 100;
        this.lastUpdateTime = Date.now();
    }

    move(movementData) {
        this.x = movementData.x;
        this.y = movementData.y;
        this.rotation = movementData.rotation;
        this.animation = movementData.animation;
        this.lastUpdateTime = Date.now();
    }

    getState() {
        return {
            id: this.id,
            name: this.name,
            model: this.model,
            color: this.color,
            x: this.x,
            y: this.y,
            z: this.z,
            rotation: this.rotation,
            animation: this.animation,
            inventory: this.inventory,
            level: this.level,
            health: this.health,
            mana: this.mana,
        };
    }
}

module.exports = Player;
