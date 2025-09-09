// client/user-input.js

// Ce module gère les entrées de l'utilisateur (clavier et souris)

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
};

let zoomDelta = 0;
let jumpPressed = false;

// Initialise les écouteurs d'événements
function init() {
	// Clavier
	window.addEventListener("keydown", (event) => {
		if (keys.hasOwnProperty(event.key)) {
			event.preventDefault();
			if (event.key === " " && !keys[" "]) {
				// Détecte un nouvel appui sur Espace
				jumpPressed = true;
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
			// Normalise la valeur du zoom et ajoute un signe
			zoomDelta += Math.sign(event.deltaY);
		},
		{ passive: false }
	);
}

// Fonction pour réinitialiser le delta du zoom après utilisation
function resetZoom() {
	zoomDelta = 0;
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
		jumpPressed = false; // Se réinitialise après lecture
		return pressed;
	},
	resetZoom,
};
