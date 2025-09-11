import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

class Character {
	constructor(scene, options) {
		this.scene = scene;
		// this.onLoadCallback = onLoadCallback;
		this.isLocal = options.isLocal || false;
		this.onLoadCallback = options.onLoadCallback;

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

				// à l'origine le model gltf est tourné dans le mauvais sens. il est de face au lieu d'etre de dos. il faut le retourner avant de creer model
				// Rotate the model 180 degrees to face away from the camera
				// model.rotation.y = Math.PI / 2;

				this.scene.add(model);
				this.model = model;

				// Initialize target quaternion and position to the model's initial state
				this.targetQuaternion.copy(this.model.quaternion);
				this.targetPosition.copy(this.model.position);

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
