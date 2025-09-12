class ResourceManager {
    constructor() {
        this.itemModels = {
            Wood: { model: 'models/wood.gltf', scale: 0.1 },
            Stone: { model: 'models/stone.gltf', scale: 0.05 },
            Herb: { model: 'models/herb.gltf', scale: 0.2 },
        };

        this.maxInstancesPerType = {
            Wood: 10,
            Stone: 10,
            Herb: 10,
        };

        this.currentInstances = {
            Wood: 0,
            Stone: 0,
            Herb: 0,
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
