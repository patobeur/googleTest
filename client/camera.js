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
        lerpSpeed: 0.1, // How quickly the camera follows
	},
};

// Variables for camera rotation
let euler = new THREE.Euler(0, 0, 0, "YXZ");
const PI_2 = Math.PI / 2;

// Temp vectors to avoid creating new ones in the loop
const targetPosition = new THREE.Vector3();
const targetQuaternion = new THREE.Quaternion();

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
	if (!camRig || !player || !player.character || !player.character.model) return;

    const playerModel = player.character.model;

	// --- Position Interpolation ---
    // The camera rig should be at the player's position.
    // We will smoothly move it there.
    targetPosition.copy(playerModel.position);
    camRig.position.lerp(targetPosition, conf.camera.lerpSpeed);

	// --- Rotation ---
	// Vertical rotation (pitch) is controlled by the mouse.
	euler.x -= UserInput.mouseDeltaY * conf.camera.sensitivity;
	euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x)); // Clamp vertical rotation

    // Horizontal rotation (yaw) is now driven by the player's rotation.
    // We will smoothly interpolate to the player's yaw.
    const playerEuler = new THREE.Euler().setFromQuaternion(playerModel.quaternion, 'YXZ');

    const targetEuler = new THREE.Euler(euler.x, playerEuler.y, 0, 'YXZ');
    targetQuaternion.setFromEuler(targetEuler);
    camRig.quaternion.slerp(targetQuaternion, conf.camera.lerpSpeed);


	// --- Zoom ---
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
