// client/main.js

import { ThreeScene } from './three-scene.js';
import { UserInput } from './user-input.js';

// DOM Elements
const authContainer = document.getElementById('auth-container');
const gameContainer = document.getElementById('game-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetPasswordForm = document.getElementById('reset-password-form');

const showRegister = document.getElementById('show-register');
const showLoginFromRegister = document.getElementById('show-login-from-register');
const showForgotPassword = document.getElementById('show-forgot-password');
const showLoginFromForgot = document.getElementById('show-login-from-forgot');

const registerButton = document.getElementById('register-button');
const forgotButton = document.getElementById('forgot-button');
const resetButton = document.getElementById('reset-button');


// Show/Hide forms
function showForm(formToShow) {
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
    resetPasswordForm.style.display = 'none';
    formToShow.style.display = 'block';
}

showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(registerForm);
});

showLoginFromRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(loginForm);
});

showForgotPassword.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(forgotPasswordForm);
});

showLoginFromForgot.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(loginForm);
});

const loginButton = document.getElementById('login-button');

// Registration
registerButton.addEventListener('click', async () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
        alert('Registration successful! Please login.');
        showLogin.click();
    } else {
        const data = await response.json();
        alert(`Registration failed: ${data.message}`);
    }
});

// Login
loginButton.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('token', token);
        authContainer.style.display = 'none';
        gameContainer.style.display = 'block';
        initializeGame(token);
    } else {
        const data = await response.json();
        alert(`Login failed: ${data.message}`);
    }
});

// Forgot Password
forgotButton.addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value;
    const response = await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = await response.json();
    alert(data.message);
    if (response.ok) {
        showForm(resetPasswordForm);
    }
});

// Reset Password
resetButton.addEventListener('click', async () => {
    const token = document.getElementById('reset-token').value;
    const password = document.getElementById('reset-password').value;
    const response = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
    });
    const data = await response.json();
    alert(data.message);
    if (response.ok) {
        showForm(loginForm);
    }
});


// Game Logic (to be initialized after login)
function initializeGame(token) {
    // 1. Initialisation des modules
    ThreeScene.init(document.getElementById('game-canvas'));
    UserInput.init();

    // 2. Connexion et logique Socket.IO
    const socket = io({
        auth: {
            token
        }
    });
    let myId = null;

    socket.on('connect', () => {
        myId = socket.id;
        console.log('Connecté au serveur avec l-ID:', myId);
    });

    socket.on('currentState', (allPlayers) => {
        for (let id in allPlayers) {
            if (allPlayers.hasOwnProperty(id)) {
                ThreeScene.addPlayer(allPlayers[id]);
            }
        }
    });

    socket.on('newPlayer', (playerInfo) => {
        ThreeScene.addPlayer(playerInfo);
    });

    socket.on('playerMoved', (playerInfo) => {
        ThreeScene.updatePlayerPosition(playerInfo);
    });

    socket.on('playerDisconnected', (id) => {
        ThreeScene.removePlayer(id);
    });

    // Le serveur nous renvoie à notre dernière position valide
    socket.on('correction', (lastValidPosition) => {
        console.log('Correction de position reçue du serveur.');
        // On met à jour la position de notre joueur avec les données du serveur
        const correctedPlayerInfo = { id: myId, ...lastValidPosition };
        ThreeScene.updatePlayerPosition(correctedPlayerInfo);
    });

    // 3. Logique de jeu principale
    const playerSpeed = 5;

    function gameLogic() {
        // Vérifie si notre joueur existe dans la scène
        if (myId && ThreeScene.players[myId]) {
            let moved = false;
            const playerObject = ThreeScene.players[myId];

            if (UserInput.keys.ArrowUp) {
                playerObject.position.y += playerSpeed;
                moved = true;
            }
            if (UserInput.keys.ArrowDown) {
                playerObject.position.y -= playerSpeed;
                moved = true;
            }
            if (UserInput.keys.ArrowLeft) {
                playerObject.position.x -= playerSpeed;
                moved = true;
            }
            if (UserInput.keys.ArrowRight) {
                playerObject.position.x += playerSpeed;
                moved = true;
            }

            // Si on a bougé, on envoie la nouvelle position au serveur
            if (moved) {
                socket.emit('playerMovement', {
                    x: playerObject.position.x,
                    y: playerObject.position.y,
                });
            }
        }
    }

    // 4. Démarrage de la boucle d'animation avec notre logique de jeu
    ThreeScene.animate(gameLogic);
}
