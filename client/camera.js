// client/camera.js

import * as THREE from "three";
import { UserInput } from "./user-input.js";

let camera, camRig;
const conf = {
	camera: {
		zoomSpeed: 5,
		minZoom: 5,
		maxZoom: 20,
		sensitivity: 0.002,
		distance: 10,
	},
};

// Variables for camera rotation
let euler = new THREE.Euler(0, 0, 0, "YXZ");
const PI_2 = Math.PI / 2;

function init(canvas, scene) {
	camera = new THREE.PerspectiveCamera(
		60,
		canvas.clientWidth / canvas.clientHeight,
		0.1,
		1000
	);
	camera.position.z = conf.camera.distance;

	camRig = new THREE.Object3D();
	camRig.add(camera);
	scene.add(camRig);

	window.addEventListener("resize", () => onWindowResize(canvas), false);
}

function onWindowResize(canvas) {
	if (!camera) return;
	camera.aspect = canvas.clientWidth / canvas.clientHeight;
	camera.updateProjectionMatrix();
}

function update(player, zoomDelta) {
	if (!camRig || !player) return;

	// Camera rotation from mouse input
	euler.y -= UserInput.mouseDeltaX * conf.camera.sensitivity;
	euler.x -= UserInput.mouseDeltaY * conf.camera.sensitivity;
	euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x)); // Clamp vertical rotation

	camRig.quaternion.setFromEuler(euler);

	// Position the camera rig at the player's location
	camRig.position.copy(player.position);

	// Handle zoom
	conf.camera.distance -= zoomDelta * conf.camera.zoomSpeed;
	conf.camera.distance = Math.max(
		conf.camera.minZoom,
		Math.min(conf.camera.maxZoom, conf.camera.distance)
	);
	camera.position.z = conf.camera.distance;

	// Reset mouse delta after using it
	UserInput.resetMouseDelta();
}

export const Camera = {
	init,
	update,
	get camera() {
		return camera;
	},
	get camRig() {
		return camRig;
	},
};
