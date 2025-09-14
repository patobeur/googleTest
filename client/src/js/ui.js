// client/ui.js
import { CharacterSelection } from "./character-selection.js";

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
const inventoryContainer = document.getElementById("inventory-container");
const inventoryCloseBtn = document.getElementById("inventory-close-btn");
const inventorySlots = document.getElementById("inventory-slots");

let onDropItem = null;
let onMoveItem = null;
let tooltipElement = null;

const itemDetails = {
	wood: { name: "Bois", description: "Un morceau de bois de base." },
	stone: { name: "Pierre", description: "Une pierre grise et solide." },
	herb: { name: "Herbe", description: "Un peu d'herbe." },
	iron: { name: "Fer", description: "Un minerai de fer brut." },
};

function setOnDropItem(callback) {
	onDropItem = callback;
}

function setOnMoveItem(callback) {
	onMoveItem = callback;
}

// Draggable window logic
function makeDraggable(element, handle) {
	let pos1 = 0,
		pos2 = 0,
		pos3 = 0,
		pos4 = 0;
	handle.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		e.preventDefault();
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e.preventDefault();
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		element.style.top = element.offsetTop - pos2 + "px";
		element.style.left = element.offsetLeft - pos1 + "px";
	}

	function closeDragElement() {
		document.onmouseup = null;
		document.onmousemove = null;
	}
}

function openInventory() {
	inventoryContainer.style.display = "flex";
}

function closeInventory() {
	inventoryContainer.style.display = "none";
}

const itemColors = {
	wood: 0x8b4513, // Brown
	stone: 0x808080, // Grey
	herb: 0x00ff00, // Green
	iron: 0x43464b, // Dark silver
};

function updateInventory(inventory) {
	inventorySlots.innerHTML = "";
	if (!inventory) return;

	for (let i = 0; i < inventory.length; i++) {
		const slotDiv = document.createElement("div");
		slotDiv.className = "inventory-slot";
		slotDiv.dataset.slotIndex = i;

		const slotData = inventory[i];
		if (slotData) { // Check if the slot has data
			const itemDiv = document.createElement("div");
			itemDiv.className = "inventory-item";

			const color = itemColors[slotData.type] || "#ff9800"; // Access type directly
			itemDiv.style.backgroundColor = `#${color.toString(16).padStart(6, "0")}`;

			itemDiv.draggable = true;
			// No item.id on the slot object anymore, this can be removed.
			// itemDiv.dataset.itemId = slotData.item.id;

			itemDiv.addEventListener("dragstart", (e) => {
				e.dataTransfer.setData(
					"application/json",
					JSON.stringify({ fromIndex: i })
				);
			});

			// Tooltip events
			itemDiv.addEventListener("mouseenter", (e) => {
				const details = itemDetails[slotData.type]; // Access type directly
				if (!details) return;

				tooltipElement.innerHTML = `
                    <strong>${details.name}</strong><br>
                    Quantité: ${slotData.quantity}<br>
                    <em>${details.description}</em>
                `;
				tooltipElement.style.display = "block";
			});
			itemDiv.addEventListener("mouseleave", () => {
				tooltipElement.style.display = "none";
			});
			itemDiv.addEventListener("mousemove", (e) => {
				tooltipElement.style.left = e.pageX + 10 + "px";
				tooltipElement.style.top = e.pageY + 10 + "px";
			});

			if (slotData.quantity > 1) {
				const quantityDiv = document.createElement("div");
				quantityDiv.className = "item-quantity";
				quantityDiv.textContent = slotData.quantity;
				itemDiv.appendChild(quantityDiv);
			}

			slotDiv.appendChild(itemDiv);
		}
		inventorySlots.appendChild(slotDiv);
	}
}

document.body.addEventListener("dragover", (e) => {
	e.preventDefault();
});

document.body.addEventListener("drop", (e) => {
	e.preventDefault();
	if (e.target === document.body || e.target.id === "game-canvas") {
		try {
			const data = JSON.parse(e.dataTransfer.getData("application/json"));
			if (data && onDropItem) {
				onDropItem(data.fromIndex);
			}
		} catch (error) {
			// Ignore if data is not in the expected format
		}
	}
});

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
	// Create tooltip element
	tooltipElement = document.createElement("div");
	tooltipElement.className = "inventory-tooltip";
	document.body.appendChild(tooltipElement);

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
		const token = localStorage.getItem("token");
		if (token) {
			document.getElementById("game-container").style.display = "none";
			CharacterSelection.show(token);
		} else {
			// Fallback if token is somehow lost
			window.location.reload();
		}
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

	// Inventory logic
	const inventoryLink = document.createElement("a");
	inventoryLink.href = "#";
	inventoryLink.textContent = "Inventaire";
	menuDropdown.insertBefore(inventoryLink, profileLink);

	inventoryLink.addEventListener("click", (e) => {
		e.preventDefault();
		openInventory();
		menuDropdown.style.display = "none";
	});

	inventoryCloseBtn.addEventListener("click", closeInventory);

	makeDraggable(
		inventoryContainer,
		inventoryContainer.querySelector(".inventory-header")
	);

	// Drag and drop for inventory slots
	inventorySlots.addEventListener("dragover", (e) => {
		e.preventDefault();
	});

	inventorySlots.addEventListener("drop", (e) => {
		e.preventDefault();
		try {
			const data = JSON.parse(e.dataTransfer.getData("application/json"));
			if (!data) return;

			const fromIndex = data.fromIndex;
			let toSlot = e.target;
			while (toSlot && !toSlot.classList.contains("inventory-slot")) {
				toSlot = toSlot.parentElement;
			}

			if (toSlot) {
				const toIndex = parseInt(toSlot.dataset.slotIndex, 10);
				if (onMoveItem && fromIndex !== toIndex) {
					onMoveItem({ fromIndex, toIndex });
				}
			}
		} catch (error) {
			// Ignore if data is not in the expected format
		}
	});
}

export const UI = {
	init,
	openInventory,
	closeInventory,
	updateInventory,
	setOnDropItem,
	setOnMoveItem,
};
