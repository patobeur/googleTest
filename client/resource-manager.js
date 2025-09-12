class ResourceManager {
    constructor() {
        this.itemModels = {
            wood: { model: 'models/wood.gltf', scale: 0.1 },
            stone: { model: 'models/stone.gltf', scale: 0.05 },
            herb: { model: 'models/herb.gltf', scale: 0.2 },
            iron: { model: 'models/iron.gltf', scale: 0.05 },
        };

        this.maxInstancesPerType = {
            wood: 10,
            stone: 10,
            herb: 10,
            iron: 10,
        };

        this.currentInstances = {
            wood: 0,
            stone: 0,
            herb: 0,
            iron: 0,
        };
    }

    canDisplayItem(itemType) {
        return this.currentInstances[itemType] < this.maxInstancesPerType[itemType];
    }

    registerItem(itemType) {
        if (this.currentInstances[itemType] !== undefined) {
            this.currentInstances[itemType]++;
        }
    }

    unregisterItem(itemType) {
        if (this.currentInstances[itemType] !== undefined && this.currentInstances[itemType] > 0) {
            this.currentInstances[itemType]--;
        }
    }
}

export const resourceManager = new ResourceManager();
