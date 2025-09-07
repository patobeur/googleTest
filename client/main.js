// client/main.js

import * as THREE from "three";
import { GLTFLoader } from "/node_modules_min/three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "/node_modules_min/three/examples/jsm/controls/OrbitControls.js";

import { ThreeScene } from "./three-scene.js";
import { UserInput } from "./user-input.js";

// DOM Elements
const authContainer = document.getElementById("auth-container");
const gameContainer = document.getElementById("game-container");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const forgotPasswordForm = document.getElementById("forgot-password-form");
const resetPasswordForm = document.getElementById("reset-password-form");

const showRegister = document.getElementById("show-register");
const showLoginFromRegister = document.getElementById(
	"show-login-from-register"
);
const showForgotPassword = document.getElementById("show-forgot-password");
const showLoginFromForgot = document.getElementById("show-login-from-forgot");

const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");
const forgotButton = document.getElementById("forgot-button");
const resetButton = document.getElementById("reset-button");

// Show/Hide forms
function showForm(formToShow) {
	loginForm.style.display = "none";
	registerForm.style.display = "none";
	forgotPasswordForm.style.display = "none";
	resetPasswordForm.style.display = "none";
	gameContainer.style.display = "none";
	formToShow.style.display = "block";
}

function showGame() {
	authContainer.style.display = "none";
	gameContainer.style.display = "block";
}

// Game Logic (to be initialized after login)
function initializeGame(token) {
	// 1. Initialisation des modules
	ThreeScene.init(document.getElementById("game-canvas"));
	UserInput.init();

	// 2. Connexion et logique Socket.IO
	const socket = io({
		auth: {
			token,
		},
	});
	let myId = null;

	socket.on("connect", () => {
		myId = socket.id;
		console.log("Connecté au serveur avec l-ID:", myId);
	});

	socket.on("connect_error", (err) => {
		if (err.message === "Authentication error") {
			console.error("Authentication failed, please log in again.");
			localStorage.removeItem("token");
			showForm(loginForm);
		}
	});

	socket.on("currentState", (allPlayers) => {
		for (let id in allPlayers) {
			if (allPlayers.hasOwnProperty(id)) {
				ThreeScene.addPlayer(allPlayers[id]);
			}
		}
	});

	socket.on("newPlayer", (playerInfo) => {
		ThreeScene.addPlayer(playerInfo);
	});

	socket.on("playerMoved", (playerInfo) => {
		ThreeScene.updatePlayerPosition(playerInfo);
	});

	socket.on("playerDisconnected", (id) => {
		ThreeScene.removePlayer(id);
	});

	socket.on("correction", (lastValidPosition) => {
		// On met à jour la position de notre joueur avec les données du serveur
		const correctedPlayerInfo = { id: myId, ...lastValidPosition };
		ThreeScene.updatePlayerPosition(correctedPlayerInfo);
	});

	// 3. Logique de jeu principale
	const playerSpeed = 1;

	function gameLogic() {
		// Vérifie si notre joueur existe dans la scène
		if (myId && ThreeScene.players[myId]) {
			let moved = false;
			const playerObject = ThreeScene.players[myId];

			if (UserInput.keys.ArrowUp || UserInput.keys["z"]) {
				playerObject.position.y += playerSpeed;
				moved = true;
			}
			if (UserInput.keys.ArrowDown || UserInput.keys["s"]) {
				playerObject.position.y -= playerSpeed;
				moved = true;
			}
			if (UserInput.keys.ArrowLeft || UserInput.keys["q"]) {
				playerObject.position.x -= playerSpeed;
				moved = true;
			}
			if (UserInput.keys.ArrowRight || UserInput.keys["d"]) {
				playerObject.position.x += playerSpeed;
				moved = true;
			}

			// Si on a bougé, on envoie la nouvelle position au serveur
			if (moved) {
				socket.emit("playerMovement", {
					x: playerObject.position.x,
					y: playerObject.position.y,
				});
			}

			// Mise à jour de la caméra pour suivre le joueur et gérer le zoom
			ThreeScene.updateKamera(myId, UserInput.zoomDelta);
			UserInput.resetZoom(); // Réinitialise le zoom pour qu'il ne s'applique qu'une fois
		}
	}

	// 4. Démarrage de la boucle d'animation avec notre logique de jeu
	ThreeScene.animate(gameLogic);
}

// --- Menu, Modals, and Theme ---
const menuIcon = document.getElementById("menu-icon");
const menuDropdown = document.getElementById("menu-dropdown");
const profileLink = document.getElementById("profile-link");
const infoLink = document.getElementById("info-link");
const logoutLink = document.getElementById("logout-link");
const profileModal = document.getElementById("profile-modal");
const infoModal = document.getElementById("info-modal");
const modals = document.querySelectorAll(".modal");
const closeBtns = document.querySelectorAll(".close-btn");

// Theme switcher
function applyTheme(theme) {
	if (theme === "light") {
		document.body.classList.add("light-theme");
		document.body.classList.remove("dark-theme");
	} else {
		document.body.classList.add("dark-theme");
		document.body.classList.remove("light-theme");
	}
}

// Add theme switcher to menu
const themeSwitcher = document.createElement("a");
themeSwitcher.href = "#";
themeSwitcher.textContent = "Changer de thème";
menuDropdown.appendChild(themeSwitcher);

themeSwitcher.addEventListener("click", (e) => {
	e.preventDefault();
	const currentTheme = localStorage.getItem("theme") || "dark";
	const newTheme = currentTheme === "dark" ? "light" : "dark";
	localStorage.setItem("theme", newTheme);
	applyTheme(newTheme);
});

// Menu toggle
menuIcon.addEventListener("click", () => {
	const isDisplayed = menuDropdown.style.display === "block";
	menuDropdown.style.display = isDisplayed ? "none" : "block";
});

// Modal logic
function openModal(modal) {
	modal.style.display = "flex";
}

function closeModal(modal) {
	modal.style.display = "none";
}

profileLink.addEventListener("click", (e) => {
	e.preventDefault();
	openModal(profileModal);
	menuDropdown.style.display = "none";
});

infoLink.addEventListener("click", (e) => {
	e.preventDefault();
	openModal(infoModal);
	menuDropdown.style.display = "none";
});

logoutLink.addEventListener("click", (e) => {
	e.preventDefault();
	localStorage.removeItem("token");
	window.location.reload();
});

closeBtns.forEach((btn) => {
	btn.addEventListener("click", () => {
		modals.forEach((modal) => closeModal(modal));
	});
});

window.addEventListener("click", (e) => {
	modals.forEach((modal) => {
		if (e.target === modal) {
			closeModal(modal);
		}
	});
});

// Profile form submission
const profileForm = document.getElementById("profile-form");
profileForm.addEventListener("submit", (e) => {
	e.preventDefault();
	const username = document.getElementById("profile-username").value;
	const color = document.getElementById("profile-color").value;
	console.log("Saving profile...", { username, color });
	// Here you would typically send this data to the server
	closeModal(profileModal);
});

// --- Main Execution ---
function main() {
	// Apply saved theme on load
	const savedTheme = localStorage.getItem("theme") || "dark";
	applyTheme(savedTheme);

	// Setup form event listeners
	showRegister.addEventListener("click", (e) => {
		e.preventDefault();
		showForm(registerForm);
	});
	showLoginFromRegister.addEventListener("click", (e) => {
		e.preventDefault();
		showForm(loginForm);
	});
	showForgotPassword.addEventListener("click", (e) => {
		e.preventDefault();
		showForm(forgotPasswordForm);
	});
	showLoginFromForgot.addEventListener("click", (e) => {
		e.preventDefault();
		showForm(loginForm);
	});

	// Setup button event listeners
	registerButton.addEventListener("click", async () => {
		const email = document.getElementById("register-email").value;
		const password = document.getElementById("register-password").value;
		const response = await fetch("/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		if (response.ok) {
			alert("Registration successful! Please login.");
			showForm(loginForm);
		} else {
			const data = await response.json();
			alert(`Registration failed: ${data.message}`);
		}
	});

	loginButton.addEventListener("click", async () => {
		const email = document.getElementById("login-email").value;
		const password = document.getElementById("login-password").value;
		const response = await fetch("/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		if (response.ok) {
			const { token } = await response.json();
			localStorage.setItem("token", token);
			showGame();
			initializeGame(token);
		} else {
			const data = await response.json();
			alert(`Login failed: ${data.message}`);
		}
	});

	forgotButton.addEventListener("click", async () => {
		const email = document.getElementById("forgot-email").value;
		const response = await fetch("/auth/forgot-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email }),
		});
		const data = await response.json();
		alert(data.message);
		if (response.ok) {
			showForm(resetPasswordForm);
		}
	});

	resetButton.addEventListener("click", async () => {
		const token = document.getElementById("reset-token").value;
		const password = document.getElementById("reset-password").value;
		const response = await fetch("/auth/reset-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token, password }),
		});
		const data = await response.json();
		alert(data.message);
		if (response.ok) {
			showForm(loginForm);
		}
	});

	// Check for existing token on page load
	const token = localStorage.getItem("token");
	if (token) {
		showGame();
		initializeGame(token);
	} else {
		showForm(loginForm);
	}
}

window.addEventListener("load", () => {
	// if (SOCKET) {
	if (THREE) {
		console.log("THREE ok");
		if (Ammo) {
			console.log("Ammo ok");
			Ammo().then(() => {
				console.log("start");
				main();
			});
		}
	}
	// }
});
