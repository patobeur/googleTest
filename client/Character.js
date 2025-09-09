import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

class Character {
	constructor(scene, onLoadCallback) {
		this.scene = scene;
		this.onLoadCallback = onLoadCallback;

		this.gltf = null;
		this.mixer = null;
		this.animations = new Map();
		this.actionClips = {
			idle: null,
			run: null,
			jump: null,
		};
		this.currentAction = null;
		this.model = null;

		// New properties for rotation
		this.targetQuaternion = new THREE.Quaternion();
		this.rotationSpeed = 0.1;
	}

	load(modelUrl) {
		const loader = new GLTFLoader();
		loader.load(
			modelUrl,
			(gltf) => {
				this.gltf = gltf;
				// à l'origine le model gltf est tourné dans le mauvais sens. il est de face au lieu d'etre de dos. il faut le retourner avant de creer model
				const model = clone(this.gltf.scene);
				this.scene.add(model);
				this.model = model;

				// Initialize target quaternion to the model's initial rotation
				this.targetQuaternion.copy(this.model.quaternion);

				this.mixer = new THREE.AnimationMixer(this.model);
				this._prepareAnimations();

				this.playAnimation("idle");

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

		this.actionClips.idle = this._findAnimation(animationMap, "idle");
		this.actionClips.run = this._findAnimation(animationMap, "run");
		this.actionClips.jump = this._findAnimation(animationMap, "jump");
	}

	_findAnimation(animationMap, name) {
		// Exact match first
		let action = animationMap.get(name);
		if (action) return action;

		// Partial match
		for (const [clipName, clipAction] of animationMap.entries()) {
			if (clipName.includes(name)) {
				return clipAction;
			}
		}

		// Fallback to the first animation if no match is found for idle/run
		if (name === "idle" || name === "run") {
			console.warn(
				`Animation clip for "${name}" not found. Using first available clip.`
			);
			return animationMap.values().next().value || null;
		}

		return null;
	}

	playAnimation(name) {
		const newAction = this.actionClips[name.toLowerCase()];

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
			// Smoothly interpolate the model's rotation
			this.model.quaternion.slerp(this.targetQuaternion, this.rotationSpeed);
		}
	}

	setPosition(x, y, z) {
		if (this.model) {
			this.model.position.set(x, y, z);
		}
	}
}

export { Character };
