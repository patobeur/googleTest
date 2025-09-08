import * as THREE from "three";
const players = {}; // Stocke les objets 3D des joueurs
let conf = {
	camera: {
		z: 300,
		zoomSpeed: 20,
		minZoom: 200,
		maxZoom: 800,
	},
};
let scene, camera, renderer, camRig;

// Initialise la scène, la caméra, le rendu et les lumières.
function init(canvas) {
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x222222);

	camera = new THREE.PerspectiveCamera(
		60,
		canvas.clientWidth / canvas.clientHeight,
		0.1,
		1000
	);

	// camera.position.z = conf.camera.z;

	// Camera Rig
	camRig = new THREE.Object3D();
	camRig.add(camera);
	camRig.position.z = conf.camera.z;
	scene.add(camRig);

	renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);

	const light = new THREE.AmbientLight(0xffffff);
	scene.add(light);

	addCenteredCube();

	window.addEventListener("resize", onWindowResize, false);

	onWindowResize();
	console.log("scene on");

	const grid = new THREE.GridHelper(5000, 5000 / 10, 0x666666, 0x444444);
	grid.rotateX(Math.PI / 2);
	scene.add(grid);
}

function onWindowResize() {
	if (!camera || !renderer) return;
	const canvas = renderer.domElement;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

let gameLogicCallback = () => {};

function renderLoop() {
	requestAnimationFrame(renderLoop);

	gameLogicCallback();

	renderer.render(scene, camera);
}

function animate(gameLogic) {
	if (gameLogic) {
		gameLogicCallback = gameLogic;
	}
	renderLoop();
}

function addPlayer(playerInfo) {
	const geometry = new THREE.BoxGeometry(10, 10, 10);
	const material = new THREE.MeshStandardMaterial({ color: playerInfo.color });
	const playerCube = new THREE.Mesh(geometry, material);

	// next to come
	const PlayerGroup = new THREE.Group();
	PlayerGroup.add(playerCube);
	PlayerGroup.position.x = playerInfo.x;
	PlayerGroup.position.y = playerInfo.y;

	players[playerInfo.id] = PlayerGroup;

	scene.add(PlayerGroup);
}

function addCenteredCube() {
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
	const cube = new THREE.Mesh(geometry, material);

	cube.position.x = 0;
	cube.position.y = 0;
	cube.position.z = 0.5;

	scene.add(cube);
}

function updatePlayerPosition(playerInfo) {
	if (players[playerInfo.id]) {
		players[playerInfo.id].position.x = playerInfo.x;
		players[playerInfo.id].position.y = playerInfo.y;
	}
}

function removePlayer(id) {
	if (players[id]) {
		scene.remove(players[id]);
		delete players[id];
	}
}

function updateCamera(myId, zoomDelta) {
	let player = players[myId];
	if (!camera || !player) return;

	camRig.position.x = player.position.x;
	camRig.position.y = player.position.y;

	camRig.position.z += zoomDelta * conf.camera.zoomSpeed;

	camRig.position.z = Math.max(
		conf.camera.minZoom,
		Math.min(conf.camera.maxZoom, camRig.position.z)
	);
}

export const ThreeScene = {
	init,
	animate,
	addPlayer,
	updatePlayerPosition,
	removePlayer,
	updateCamera,
	// Expose l'objet players pour que la logique de jeu puisse y accéder
	players,
};
