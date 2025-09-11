// client/auth.js

// This function will be passed from main.js to be called on successful login
let onLoginSuccess = null;

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
	authContainer.style.display = "block";
	gameContainer.style.display = "none";
	formToShow.style.display = "block";
}

function showGame() {
	authContainer.style.display = "none";
	gameContainer.style.display = "block";
}

function init(loginCallback) {
	onLoginSuccess = loginCallback;

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
		const name = document.getElementById("register-name").value;
		const email = document.getElementById("register-email").value;
		const password = document.getElementById("register-password").value;
		const response = await fetch("/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password, name }),
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
			if (onLoginSuccess) {
				onLoginSuccess(token);
			}
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
		if (onLoginSuccess) {
			onLoginSuccess(token);
		}
	} else {
		showForm(loginForm);
	}
}

export const Auth = {
	init,
};
