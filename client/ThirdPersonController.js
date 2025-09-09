import * as THREE from "three";
import { UserInput } from "./user-input.js";

class ThirdPersonController {
	constructor(params) {
		this.camera = params.camera;
		this.character = params.character;
		this.scene = params.scene;

		// Config
		this.conf = {
			sensitivity: 0.002,
			camera: {
				lerpSpeed: 0.08,
				distance: 5,
				minZoom: 2,
				maxZoom: 10,
				zoomSpeed: 2,
			},
			player: {
				speed: 5,
				rotationLerpSpeed: 0.1,
			},
		};

		// State
		this.cameraEuler = new THREE.Euler(0, 0, 0, "YXZ");
		this.PI_2 = Math.PI / 2;

		this.target = new THREE.Object3D();
		this.scene.add(this.target);
	}

	update(deltaTime) {
		if (!this.character || !this.character.model) return;

		const playerModel = this.character.model;

		// === 1. Handle Camera Rotation from Mouse ===
		this.cameraEuler.y -= UserInput.mouseDeltaX * this.conf.sensitivity;
		this.cameraEuler.x -= UserInput.mouseDeltaY * this.conf.sensitivity;
		this.cameraEuler.x = Math.max(-this.PI_2, Math.min(this.PI_2, this.cameraEuler.x)); // Clamp vertical rotation

		// === 2. Calculate Movement Direction ===
		const forward = UserInput.keys.ArrowUp || UserInput.keys.z;
		const backward = UserInput.keys.ArrowDown || UserInput.keys.s;
		const left = UserInput.keys.ArrowLeft || UserInput.keys.q;
		const right = UserInput.keys.ArrowRight || UserInput.keys.d;

		let moveDirection = new THREE.Vector3();
		if (forward) moveDirection.z = -1;
		if (backward) moveDirection.z = 1;
		if (left) moveDirection.x = -1;
		if (right) moveDirection.x = 1;
		moveDirection.normalize();

		// === 3. Update Player Rotation ===
		// The player's model should always face in the direction of the camera's yaw.
		// We set the character's target quaternion, and the character itself will handle the slerp.
		const targetQuaternion = new THREE.Quaternion();
		targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraEuler.y);
		this.character.targetQuaternion.copy(targetQuaternion);

		// === 4. Update Player Position ===
		if (moveDirection.lengthSq() > 0) {
			// Rotate movement vector by camera's yaw to make it camera-relative
			moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraEuler.y);

			// Calculate new position
			const moveVector = moveDirection.multiplyScalar(this.conf.player.speed * deltaTime);
			playerModel.position.add(moveVector);

			this.character.playAnimation("run");
		} else {
			this.character.playAnimation("idle");
		}

		// === 5. Update Camera Position and Target ===
		// Update target position (what the camera looks at and orbits around)
		this.target.position.lerp(playerModel.position, this.conf.camera.lerpSpeed);
		this.target.quaternion.setFromEuler(this.cameraEuler);

		// Handle zoom
		this.conf.camera.distance -= UserInput.zoomDelta * this.conf.camera.zoomSpeed;
		this.conf.camera.distance = Math.max(
			this.conf.camera.minZoom,
			Math.min(this.conf.camera.maxZoom, this.conf.camera.distance)
		);

		// Calculate ideal camera position
		const cameraOffset = new THREE.Vector3(0, 0, this.conf.camera.distance);
		cameraOffset.applyQuaternion(this.target.quaternion);
		const cameraPosition = this.target.position.clone().add(cameraOffset);

		// Lerp camera to the ideal position
		this.camera.position.lerp(cameraPosition, this.conf.camera.lerpSpeed);
		this.camera.lookAt(this.target.position);

		// Reset input deltas
		UserInput.resetMouseDelta();
		UserInput.resetZoom();
	}
}

export { ThirdPersonController };
