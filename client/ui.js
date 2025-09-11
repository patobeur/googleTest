// client/ui.js

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

function init() {
	// Apply saved theme on load
	const savedTheme = localStorage.getItem("theme") || "dark";
	applyTheme(savedTheme);

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

		// Load saved preferences into the form
		const savedColor = localStorage.getItem("playerColor") || "#ff0000";
		const savedModel = localStorage.getItem("playerModel") || "male";
		document.getElementById("profile-color").value = savedColor;
		document.querySelector(
			`input[name="model"][value="${savedModel}"]`
		).checked = true;

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
		const model = document.querySelector('input[name="model"]:checked').value;

		// Save to localStorage
		localStorage.setItem("playerColor", color);
		localStorage.setItem("playerModel", model);

		console.log("Saving profile...", { username, color, model });
		// Here you would typically send this data to the server

		// Optional: Notify the user and maybe update the current character
		alert("Profile saved! Changes will apply on next login.");

		closeModal(profileModal);
	});
}

export const UI = {
	init,
};
