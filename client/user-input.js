// client/user-input.js

const keys = {
	ArrowUp: false,
	z: false,
	ArrowDown: false,
	s: false,
	ArrowLeft: false,
	q: false,
	ArrowRight: false,
	d: false,
	" ": false, // Pour la touche Espace
	i: false,
	e: false,
};

const actions = {
	inventory: false,
	pickup: false,
};

let zoomDelta = 0;
let jumpPressed = false;
let mouseDeltaX = 0;
let mouseDeltaY = 0;
let isMouseLocked = false;

// Initialise les écouteurs d'événements
function init() {
	// Clavier
	window.addEventListener("keydown", (event) => {
		if (keys.hasOwnProperty(event.key)) {
			event.preventDefault();
			if (event.key === " " && !keys[" "]) {
				jumpPressed = true;
			}
			if (event.key === "i" && !keys["i"]) {
				actions.inventory = true;
			}
			if (event.key === "e" && !keys["e"]) {
				actions.pickup = true;
			}
			keys[event.key] = true;
		}
	});

	window.addEventListener("keyup", (event) => {
		if (keys.hasOwnProperty(event.key)) {
			event.preventDefault();
			keys[event.key] = false;
		}
	});

	// Molette de la souris pour le zoom
	window.addEventListener(
		"wheel",
		(event) => {
			event.preventDefault();
			zoomDelta += Math.sign(event.deltaY);
		},
		{ passive: false }
	);

	// Mouvement de la souris
	document.addEventListener("mousemove", (event) => {
		if (isMouseLocked) {
			mouseDeltaX += event.movementX;
			mouseDeltaY += event.movementY;
		}
	});

	// Verrouillage du pointeur
	const canvas = document.getElementById("game-canvas");
	canvas.addEventListener("click", () => {
		if (!isMouseLocked) {
			canvas.requestPointerLock();
		}
	});

	document.addEventListener("pointerlockchange", () => {
		isMouseLocked = document.pointerLockElement === canvas;
	});
}

// Fonctions pour réinitialiser les deltas après utilisation
function resetZoom() {
	zoomDelta = 0;
}

function resetMouseDelta() {
	mouseDeltaX = 0;
	mouseDeltaY = 0;
}

function getAndResetActions() {
	const currentActions = { ...actions };
	actions.inventory = false;
	actions.pickup = false;
	return currentActions;
}

// Exporte les états et les fonctions
export const UserInput = {
	init,
	keys,
	get zoomDelta() {
		return zoomDelta;
	},
	get jumpJustPressed() {
		const pressed = jumpPressed;
		jumpPressed = false;
		return pressed;
	},
	get mouseDeltaX() {
		return mouseDeltaX;
	},
	get mouseDeltaY() {
		return mouseDeltaY;
	},
	getAndResetActions,
	resetZoom,
	resetMouseDelta,
};
