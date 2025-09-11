import * as THREE from "three";
import { Character } from "./Character.js";
import { ThirdPersonController } from "./ThirdPersonController.js";
import { UserInput } from "./user-input.js";

const clock = new THREE.Clock();
const players = {};
const worldItems = {};
let scene, renderer, camera, thirdPersonController;
let localPlayerId = null;

// Physics variables
let physicsWorld, collisionConfiguration, dispatcher, broadphase, solver;
let rigidBodies = [];

function initPhysics() {
	// Ammo.js initialization
	collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
	broadphase = new Ammo.btDbvtBroadphase();
	solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld(
		dispatcher,
		broadphase,
		solver,
		collisionConfiguration
	);
	physicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));

	// Add a ground plane
	const groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 1, 0), 0);
	const groundTransform = new Ammo.btTransform();
	groundTransform.setIdentity();
	groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
	const groundMass = 0;
	const localInertia = new Ammo.btVector3(0, 0, 0);
	const motionState = new Ammo.btDefaultMotionState(groundTransform);
	const rbInfo = new Ammo.btRigidBodyConstructionInfo(
		groundMass,
		motionState,
		groundShape,
		localInertia
	);
	const groundBody = new Ammo.btRigidBody(rbInfo);
	physicsWorld.addRigidBody(groundBody);
}

function setLocalPlayerId(id) {
	localPlayerId = id;
}

function init(canvas) {
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x222222);

	camera = new THREE.PerspectiveCamera(
		60,
		canvas.clientWidth / canvas.clientHeight,
		0.1,
		1000
	);

	renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(window.devicePixelRatio);

	const light = new THREE.AmbientLight(0xffffff, 1.5);
	scene.add(light);
	const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
	dirLight.position.set(5, 10, 7.5);
	scene.add(dirLight);

	const grid = new THREE.GridHelper(50, 50, 0x888888, 0x444444);
	scene.add(grid);

	// Wait for Ammo to be ready
	const ammoReadyInterval = setInterval(() => {
		if (typeof Ammo === "function") {
			clearInterval(ammoReadyInterval);
			Ammo().then(() => {
				initPhysics();
			});
		}
	}, 50);

	window.addEventListener("resize", onWindowResize, false);
	onWindowResize();
}

function onWindowResize() {
	if (!renderer || !camera) return;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

let gameLogicCallback = () => {};

function renderLoop() {
	requestAnimationFrame(renderLoop);
	const deltaTime = clock.getDelta();

	// 1. Apply user input and update controllers
	if (thirdPersonController) {
		thirdPersonController.update(deltaTime);
	}

	// 2. Step the physics world
	if (physicsWorld) {
		physicsWorld.stepSimulation(deltaTime, 10);

		// 3. Update visual meshes from physics bodies
		for (let i = 0; i < rigidBodies.length; i++) {
			const obj = rigidBodies[i];
			const objThree = obj.userData.mesh;
			const ms = obj.getMotionState();
			if (ms) {
				ms.getWorldTransform(obj.userData.transform);
				const p = obj.userData.transform.getOrigin();
				const q = obj.userData.transform.getRotation();
				objThree.position.set(p.x(), p.y(), p.z());
				objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
			}
		}
	}


	for (const id in players) {
		const player = players[id];
		if (player.character) {
			player.character.update(deltaTime);

			// Update name label position
			if (player.nameLabel) {
				const modelPosition = player.character.model.position.clone();
				modelPosition.y += 3.5; // Adjust this value to position the label above the head
				const screenPosition = modelPosition.project(camera);

				const x = ((screenPosition.x + 1) / 2) * window.innerWidth;
				const y = ((-screenPosition.y + 1) / 2) * window.innerHeight;

				player.nameLabel.style.transform = `translate(-50%, -50%)`;
				player.nameLabel.style.left = `${x}px`;
				player.nameLabel.style.top = `${y}px`;
			}
		}
	}

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
	const modelName =
		playerInfo.model === "female" ? "Kimono_Female.gltf" : "Kimono_Male.gltf";
	const modelUrl = `/toon/${modelName}`;

	const isLocal = playerInfo.id === localPlayerId;
	const character = new Character(scene, {
		isLocal: isLocal,
		onLoadCallback: (loadedCharacter) => {
			loadedCharacter.setPosition(playerInfo.x, 0, playerInfo.y); // Use Y from server as Z

			// Create name label
			const nameLabel = document.createElement("div");
			nameLabel.className = "name-label";
			nameLabel.textContent = playerInfo.name;
			document.getElementById("game-container").appendChild(nameLabel);

			players[playerInfo.id] = {
				...playerInfo,
				character: loadedCharacter,
				position: new THREE.Vector3(playerInfo.x, 0, playerInfo.y),
				nameLabel: nameLabel,
			};

			if (isLocal) {
				if (physicsWorld) {
					// Create a capsule shape for the player
					const shape = new Ammo.btCapsuleShape(0.5, 1.5);
					const transform = new Ammo.btTransform();
					transform.setIdentity();
					transform.setOrigin(new Ammo.btVector3(playerInfo.x, 0, playerInfo.y));
					const mass = 1;
					const localInertia = new Ammo.btVector3(0, 0, 0);
					shape.calculateLocalInertia(mass, localInertia);
					const motionState = new Ammo.btDefaultMotionState(transform);
					const rbInfo = new Ammo.btRigidBodyConstructionInfo(
						mass,
						motionState,
						shape,
						localInertia
					);
					const body = new Ammo.btRigidBody(rbInfo);
					// Prevent the capsule from falling over
					body.setAngularFactor(new Ammo.btVector3(0, 1, 0));
					body.setActivationState(4); // DISABLE_DEACTIVATION

					physicsWorld.addRigidBody(body);
					rigidBodies.push(body);
					body.userData = { mesh: loadedCharacter.model, transform: transform };

					players[playerInfo.id].body = body;
				}

				thirdPersonController = new ThirdPersonController({
					camera: camera,
					character: loadedCharacter,
					scene: scene,
					physicsBody: players[playerInfo.id].body,
				});
			}
		},
	});

	character.load(modelUrl);
}

function updatePlayerPosition(playerInfo) {
	// Only update remote players, local player is updated by its controller
	if (playerInfo.id === localPlayerId) return;

	const player = players[playerInfo.id];
	if (player && player.character) {
		// Use the new methods on the Character class
		player.character.setTargetPosition(playerInfo.x, 0, playerInfo.y); // Use Y from server as Z

		if (playerInfo.rotation) {
			player.character.setTargetRotation(
				playerInfo.rotation.x,
				playerInfo.rotation.y,
				playerInfo.rotation.z,
				playerInfo.rotation.w
			);
		}

		if (playerInfo.animation) {
			player.character.playAnimation(playerInfo.animation);
		}
	}
}

function removePlayer(id) {
	const player = players[id];
	if (player) {
		if (player.character) {
			scene.remove(player.character.model);
		}
		if (player.nameLabel) {
			player.nameLabel.remove();
		}
		delete players[id];
	}
}

const itemColors = {
	wood: 0x8b4513, // Brown
	stone: 0x808080, // Grey
	iron: 0x43464b, // Dark silver
};

function addItem(itemInfo) {
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const color = itemColors[itemInfo.type] || 0xffffff; // Default to white if type is unknown
	const material = new THREE.MeshStandardMaterial({ color });
	const cube = new THREE.Mesh(geometry, material);
	cube.position.set(itemInfo.x, itemInfo.y, itemInfo.z);
	scene.add(cube);

	if (physicsWorld) {
		const shape = new Ammo.btBoxShape(new Ammo.btVector3(0.5, 0.5, 0.5));
		const transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(itemInfo.x, itemInfo.y, itemInfo.z));
		const mass = 0; // Static object
		const localInertia = new Ammo.btVector3(0, 0, 0);
		const motionState = new Ammo.btDefaultMotionState(transform);
		const rbInfo = new Ammo.btRigidBodyConstructionInfo(
			mass,
			motionState,
			shape,
			localInertia
		);
		const body = new Ammo.btRigidBody(rbInfo);
		physicsWorld.addRigidBody(body);

		// Static objects don't need to be in the rigidBodies update array
		// unless they can be moved programmatically. For simplicity, we add them.
		body.userData = { mesh: cube, transform: transform };
		// rigidBodies.push(body); // We don't need to update static bodies every frame

		worldItems[itemInfo.id] = { ...itemInfo, mesh: cube, body: body };
	} else {
		worldItems[itemInfo.id] = { ...itemInfo, mesh: cube };
	}
}

function removeItem(itemId) {
	const item = worldItems[itemId];
	if (item) {
		scene.remove(item.mesh);
		if (item.body) {
			physicsWorld.removeRigidBody(item.body);
		}
		delete worldItems[itemId];
	}
}

function findClosestItem(playerPosition) {
	let closestItem = null;
	let minDistance = Infinity;
	for (const id in worldItems) {
		const item = worldItems[id];
		const distance = playerPosition.distanceTo(item.mesh.position);
		if (distance < minDistance) {
			minDistance = distance;
			closestItem = item;
		}
	}
	return closestItem;
}

export const ThreeScene = {
	init,
	animate,
	addPlayer,
	updatePlayerPosition,
	removePlayer,
	setLocalPlayerId,
	players,
	addItem,
	removeItem,
	findClosestItem,
};
