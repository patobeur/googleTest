// client/src/js/character-selection.js
import { logout } from './logout.js';

let onPlayCallback = null;
let authToken = null;
let selectedCharacter = null;

let characterSelectionContainer, characterList, authContainer, gameContainer,
    quitButton, showCreationButton, creationForm, createButton, cancelButton,
    newCharacterNameInput, newCharacterClassInput, modelSelect, colorPicker;

function renderCharacters(characters) {
    characterList.innerHTML = "";
    if (characters.length === 0) {
        showCreationButton.style.display = 'none';
        creationForm.style.display = 'block';
    } else {
        showCreationButton.style.display = 'inline-block';
        creationForm.style.display = 'none';
    }

    characters.forEach((character) => {
        const characterCard = document.createElement("div");
        characterCard.className = "character-card";
        characterCard.dataset.characterId = character.id;

        const inventoryListHtml = character.inventory && character.inventory.length > 0
            ? character.inventory.map(item => `<li>${item.item_type} <span>(x${item.quantity})</span></li>`).join('')
            : '<li>Inventaire vide</li>';

        characterCard.innerHTML = `
            <div class="avatar-placeholder">Avatar</div>
            <div class="character-info">
                <h2>${character.name}</h2>
                <div class="details">
                    <p><strong>Niveau:</strong> ${character.level}</p>
                    <p><strong>Expérience:</strong> ${character.xp_point} XP</p>
                    <p><strong>Classe:</strong> ${character.class}</p>
                    <p><strong>Modèle:</strong> ${character.model}</p>
                    <p><strong>Couleur:</strong> <span class="color-swatch" style="background-color: ${character.color};"></span></p>
                </div>
            </div>
            <div class="inventory">
                <h3>Inventaire (20 premiers)</h3>
                <ul class="inventory-list">
                    ${inventoryListHtml}
                </ul>
            </div>
            <button class="play-btn">Jouer avec ${character.name}</button>
        `;

        const playBtn = characterCard.querySelector('.play-btn');
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onPlayCallback) {
                hide();
                onPlayCallback(authToken, character);
            }
        });

        characterCard.addEventListener("click", () => {
            const currentlySelected = document.querySelector(".character-card.selected");
            if (currentlySelected) {
                currentlySelected.classList.remove("selected");
            }
            characterCard.classList.add("selected");
            selectedCharacter = character;
            // Also update the main play button if it exists
            const mainPlayButton = document.getElementById('play-button');
            if(mainPlayButton) {
                mainPlayButton.disabled = false;
                mainPlayButton.textContent = `Play as ${character.name}`;
            }
        });

        characterList.appendChild(characterCard);
    });
}

async function fetchCharacters() {
    try {
        const response = await fetch('/api/characters/detailed', { // <-- UPDATED ENDPOINT
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.status === 401 || response.status === 403) {
            console.error("Authentication failed. Logging out.");
            logout(null);
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch characters: ${response.statusText}`);
        }

        const characters = await response.json();
        renderCharacters(characters);
    } catch (error) {
        console.error("Error fetching characters:", error);
        alert("Could not load characters. Please try logging in again.");
        logout(null);
    }
}

async function fetchModels() {
    try {
        const response = await fetch('/api/character-models', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch models');
        const models = await response.json();
        modelSelect.innerHTML = models.map(model => `<option value="${model}">${model}</option>`).join('');
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

async function createNewCharacter() {
    const name = newCharacterNameInput.value.trim();
    const className = newCharacterClassInput.value.trim();
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const model = modelSelect.value;
    const color = colorPicker.value;

    if (!name || !className || !gender || !model || !color) {
        alert("All fields are required to create a character.");
        return;
    }

    try {
        const response = await fetch('/api/characters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, class: className, gender, model, color })
        });

        if (!response.ok) throw new Error('Failed to create character');

        // Hide form and refresh list
        creationForm.style.display = 'none';
        showCreationButton.style.display = 'inline-block';
        fetchCharacters();

    } catch (error) {
        console.error("Error creating character:", error);
        alert("Could not create character. See console for details.");
    }
}

function show(token) {
    authToken = token;
    authContainer.style.display = "none";
    gameContainer.style.display = "none";
    characterSelectionContainer.style.display = "block";
    creationForm.style.display = 'none';
    selectedCharacter = null;

    fetchCharacters();
    fetchModels(); // Fetch models when showing the page
}

function hide() {
    characterSelectionContainer.style.display = "none";
}

function init(playCallback) {
    onPlayCallback = playCallback;

    // Get all DOM elements
    authContainer = document.getElementById("auth-container");
    gameContainer = document.getElementById("game-container");
    characterSelectionContainer = document.getElementById("character-selection-container");
    characterList = document.getElementById("character-list");
    quitButton = document.getElementById("quit-button");
    showCreationButton = document.getElementById("show-character-creation-button");
    creationForm = document.getElementById("character-creation-form");
    createButton = document.getElementById("create-character-button");
    cancelButton = document.getElementById("cancel-creation-button");
    newCharacterNameInput = document.getElementById("new-character-name");
    newCharacterClassInput = document.getElementById("new-character-class");
    modelSelect = document.getElementById("model-select");
    colorPicker = document.getElementById("color-picker");

    // Event Listeners
    quitButton.addEventListener("click", () => {
        logout(null);
    });

    showCreationButton.addEventListener("click", () => {
        creationForm.style.display = 'block';
    });

    cancelButton.addEventListener("click", () => {
        creationForm.style.display = 'none';
    });

    createButton.addEventListener("click", createNewCharacter);
}

export const CharacterSelection = {
    init,
    show,
    hide
};
