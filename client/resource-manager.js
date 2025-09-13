class ResourceManager {
    constructor() {
        this.itemModels = {
            wood: { model: 'models/ressources/Wood.glb', scale: 0.1, color: 0x8B4513 }, // Brown
            stone: { model: 'models/ressources/Rock.glb', scale: 0.05, color: 0x808080 }, // Grey
            herb: { model: 'models/ressources/Plant.glb', scale: 0.2, color: 0x00ff00 }, // Green
            iron: { model: 'models/ressources/Rock Medium.glb', scale: 0.05, color: 0x43464B }, // Dark Grey
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
