import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

const prefix = "characterarmature|"

const AnimsNames = [
  prefix+"death",
  prefix+"gun_shoot",
  prefix+"hitrecieve",
  prefix+"hitrecieve_2",
  prefix+"idle",
  prefix+"idle_gun",
  prefix+"idle_gun_pointing",
  prefix+"idle_gun_shoot",
  prefix+"idle_neutral",
  prefix+"idle_sword",
  prefix+"interact",
  prefix+"kick_left",
  prefix+"kick_right",
  prefix+"punch_left",
  prefix+"punch_right",
  prefix+"roll",
  prefix+"run",
  prefix+"run_back",
  prefix+"run_left",
  prefix+"run_right",
  prefix+"run_shoot",
  prefix+"sword_slash",
  prefix+"walk",
  prefix+"wave"
];

class Character {
	constructor(scene, options) {
		this.scene = scene;
		// this.onLoadCallback = onLoadCallback;
		this.isLocal = options.isLocal || false;
		this.onLoadCallback = options.onLoadCallback;

		this.gltf = null;
		this.mixer = null;
		this.actionClips = {};
		this.currentAction = null;
		this.model = null;

		// New properties for rotation and position interpolation
		this.targetQuaternion = new THREE.Quaternion();
		this.targetPosition = new THREE.Vector3();
		this.rotationSpeed = 0.1;
		this.positionSpeed = 0.1;
	}

	load(modelUrl) {
		const loader = new GLTFLoader();
		loader.load(
			modelUrl,
			(gltf) => {
				this.gltf = gltf;
				const model = clone(this.gltf.scene);

				this.scene.add(model);
				this.model = model;

				// Initialize target quaternion and position to the model's initial state
				this.targetQuaternion.copy(this.model.quaternion);
				this.targetPosition.copy(this.model.position);

				this.mixer = new THREE.AnimationMixer(this.model);
				this._prepareAnimations();

				this.playAnimation(prefix+"idle");

				if (this.onLoadCallback) {
					this.onLoadCallback(this);
				}
			},
			undefined,
			(error) => {
				console.error("An error happened while loading the model:", error);
			}
		);
	}

	_prepareAnimations() {
		
		const animationMap = new Map();
		this.gltf.animations.forEach((clip) => {
			animationMap.set(clip.name.toLowerCase(), this.mixer.clipAction(clip));
		});

		this.actionClips = {}; // Reset actionClips
			// console.log(AnimsNames)
			// console.log(animationMap)

			
		AnimsNames.forEach((name) => {
			const action = animationMap.get(name);
			if (action) {
				this.actionClips[name] = action;
			} else {
				console.warn(`Animation "${name}" not found in the model.`);
			}
		});

		// Fallback for idle animation if not found
		if (!this.actionClips[prefix+"idle"]) {
			console.warn(
				`"idle" animation not found. Using first available clip as fallback.`
			);
			if (this.gltf.animations.length > 0) {
				const firstClip = this.gltf.animations[0];
				this.actionClips[prefix+"idle"] = this.mixer.clipAction(firstClip);
			}
		}
	}

	playAnimation(name) {
		const newAction = this.actionClips[name];

		if (!newAction) {
			console.warn(`Animation state "${name}" is not configured or found.`);
			return;
		}

		if (this.currentAction === newAction) return;

		if (this.currentAction) {
			this.currentAction.fadeOut(0.3);
		}

		newAction.reset().fadeIn(0.3).play();
		this.currentAction = newAction;
	}

	update(deltaTime) {
		if (this.mixer) {
			this.mixer.update(deltaTime);
		}
		if (this.model) {
			this.model.quaternion.slerp(this.targetQuaternion, this.rotationSpeed);
			// Only interpolate position for remote players
			if (!this.isLocal) {
				this.model.position.lerp(this.targetPosition, this.positionSpeed);
			}
		}
	}

	setTargetPosition(x, y, z) {
		this.targetPosition.set(x, y, z);
	}

	setTargetRotation(x, y, z, w) {
		this.targetQuaternion.set(x, y, z, w);
	}

	setPosition(x, y, z) {
		if (this.model) {
			this.model.position.set(x, y, z);
			this.targetPosition.set(x, y, z);
		}
	}
}

export { Character };
