// client/user-input.js

// Ce module gère les entrées clavier de l'utilisateur

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};

// Initialise les écouteurs d'événements
function init() {
    window.addEventListener('keydown', (event) => {
        if (keys.hasOwnProperty(event.key)) {
            event.preventDefault(); // Empêche le défilement de la page
            keys[event.key] = true;
        }
    });

    window.addEventListener('keyup', (event) => {
        if (keys.hasOwnProperty(event.key)) {
            event.preventDefault();
            keys[event.key] = false;
        }
    });
}

// Exporte l'état des touches pour qu'il soit accessible en lecture seule
// et la fonction d'initialisation.
export const UserInput = {
    init,
    keys,
};
