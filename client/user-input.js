// client/user-input.js

// Ce module gère les entrées de l'utilisateur (clavier et souris)

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};

let zoomDelta = 0;

// Initialise les écouteurs d'événements
function init() {
    // Clavier
    window.addEventListener('keydown', (event) => {
        if (keys.hasOwnProperty(event.key)) {
            event.preventDefault();
            keys[event.key] = true;
        }
    });

    window.addEventListener('keyup', (event) => {
        if (keys.hasOwnProperty(event.key)) {
            event.preventDefault();
            keys[event.key] = false;
        }
    });

    // Molette de la souris pour le zoom
    window.addEventListener('wheel', (event) => {
        event.preventDefault();
        // Normalise la valeur du zoom et ajoute un signe
        zoomDelta += Math.sign(event.deltaY);
    }, { passive: false });
}

// Fonction pour réinitialiser le delta du zoom après utilisation
function resetZoom() {
    zoomDelta = 0;
}

// Exporte les états et les fonctions
export const UserInput = {
    init,
    keys,
    get zoomDelta() { return zoomDelta; }, // Expose en lecture seule
    resetZoom,
};
