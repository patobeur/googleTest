// client/ui.js
import { AuthService } from "./auth.js";

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
let gameSocket = null;

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
function makeResizable(element, handle) {
    let initialWidth, initialHeight, initialMouseX, initialMouseY;

    handle.onmousedown = function(e) {
        e.preventDefault();
        initialWidth = element.offsetWidth;
        initialHeight = element.offsetHeight;
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;
        document.onmousemove = resizeElement;
        document.onmouseup = stopResize;
    };

    function resizeElement(e) {
        const dx = e.clientX - initialMouseX;
        const dy = e.clientY - initialMouseY;
        element.style.width = (initialWidth + dx) + 'px';
        element.style.height = (initialHeight + dy) + 'px';
    }

    function stopResize() {
        document.onmousemove = null;
        document.onmouseup = null;
    }
}

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
    setInitialInventorySize();
}

function setInitialInventorySize() {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait) {
        inventoryContainer.style.width = `${(1/3) * 100}vw`;
        inventoryContainer.style.height = `${(1/5) * 100}vh`;
    } else {
        inventoryContainer.style.width = `${(1/5) * 100}vw`;
        inventoryContainer.style.height = `${(1/3) * 100}vh`;
    }
    // Ensure position is correct after size change
    inventoryContainer.style.bottom = '20px';
    inventoryContainer.style.right = '20px';
    inventoryContainer.style.top = 'auto';
    inventoryContainer.style.left = 'auto';
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

            itemDiv.addEventListener("click", () => openItemActionModal(slotData));

			itemDiv.addEventListener("dragstart", (e) => {
				e.dataTransfer.setData("text/plain", JSON.stringify({ fromIndex: i }));

				// --- Create a drag image ---
				const dragImage = e.target.cloneNode(true);
				dragImage.style.position = "absolute";
				dragImage.style.top = "-1000px"; // Move it off-screen
				dragImage.style.opacity = 0.7;
				document.body.appendChild(dragImage);
				e.dataTransfer.setDragImage(dragImage, 24, 24); // Center the image on the cursor

				// Add a class to the original item to show it's being dragged
				e.target.classList.add("dragging");

				// Cleanup the drag image and class afterwards
				const cleanup = () => {
					document.body.removeChild(dragImage);
					e.target.classList.remove("dragging");
					// Remove the event listener itself
					document.removeEventListener("dragend", cleanup);
				};
				document.addEventListener("dragend", cleanup, { once: true });
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
			const data = JSON.parse(e.dataTransfer.getData("text/plain"));
			if (data && onDropItem) {
				onDropItem(data.fromIndex);
			}
		} catch (error) {
			// Ignore if data is not in the expected format
			
				console.log("Ignore if data is not in the expected format")
		}
	}
});

const itemActionModal = document.getElementById("item-action-modal");
const itemModalClose = document.getElementById("item-modal-close");
const itemModalDetails = document.getElementById("item-modal-details");

function openItemActionModal(itemData) {
    const details = itemDetails[itemData.type];
    if (!details) return;

    const color = itemColors[itemData.type] || '#ff9800';
    const hexColor = `#${color.toString(16).padStart(6, "0")}`;

    itemModalDetails.innerHTML = `
        <div class="item-icon-display" style="background-color: ${hexColor};"></div>
        <h4>${details.name}</h4>
        <p>Quantity: ${itemData.quantity}</p>
        <p><em>${details.description}</em></p>
    `;

    itemActionModal.style.display = 'flex';
}

function closeItemActionModal() {
    itemActionModal.style.display = 'none';
}

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

function init(socket) {
	gameSocket = socket;
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
        AuthService.logout();
        if (gameSocket && gameSocket.connected) {
            gameSocket.disconnect();
        }
        window.location.href = '/';
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
        if (e.target === itemActionModal) {
            closeItemActionModal();
        }
	});

    itemModalClose.addEventListener("click", closeItemActionModal);

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

    makeResizable(
        inventoryContainer,
        inventoryContainer.querySelector(".inventory-resize-handle")
    );

	// Drag and drop for inventory slots
	inventorySlots.addEventListener("dragover", (e) => {
		e.preventDefault();
	});

	inventorySlots.addEventListener("drop", (e) => {
		e.preventDefault();
		try {
			const data = JSON.parse(e.dataTransfer.getData("text/plain"));
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
