document.addEventListener('DOMContentLoaded', () => {
    const characterList = document.getElementById("character-list");
    const creationForm = document.getElementById("character-creation-form");
    const showCreationButton = document.getElementById("show-character-creation-button");
    const createButton = document.getElementById("create-character-button");
    const cancelButton = document.getElementById("cancel-creation-button");
    const playButton = document.getElementById("play-button");
    const quitButton = document.getElementById("quit-button");

    const newCharacterNameInput = document.getElementById("new-character-name");
    const newCharacterClassInput = document.getElementById("new-character-class");
    const modelSelect = document.getElementById("model-select");
    const colorPicker = document.getElementById("color-picker");

    let selectedCharacter = null;
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/login';
        return;
    }

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
            `;

            characterCard.addEventListener("click", () => {
                const currentlySelected = document.querySelector(".character-card.selected");
                if (currentlySelected) {
                    currentlySelected.classList.remove("selected");
                }
                characterCard.classList.add("selected");
                selectedCharacter = character;
                playButton.disabled = false;
                playButton.textContent = `Play as ${character.name}`;
            });

            characterList.appendChild(characterCard);
        });
    }

    async function fetchCharacters() {
        try {
            const response = await fetch('/api/characters/detailed', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                window.location.href = '/login';
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
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }

    async function fetchModels() {
        try {
            const response = await fetch('/api/character-models', {
                headers: { 'Authorization': `Bearer ${token}` }
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
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, class: className, gender, model, color })
            });

            if (!response.ok) throw new Error('Failed to create character');
            creationForm.style.display = 'none';
            showCreationButton.style.display = 'inline-block';
            fetchCharacters();
        } catch (error) {
            console.error("Error creating character:", error);
            alert("Could not create character. See console for details.");
        }
    }

    showCreationButton.addEventListener("click", () => {
        creationForm.style.display = 'block';
        showCreationButton.style.display = 'none';
    });

    cancelButton.addEventListener("click", () => {
        creationForm.style.display = 'none';
        showCreationButton.style.display = 'inline-block';
    });

    createButton.addEventListener("click", createNewCharacter);

    playButton.addEventListener("click", () => {
        if (selectedCharacter) {
            localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
            window.location.href = '/game';
        }
    });

    quitButton.addEventListener("click", () => {
        localStorage.removeItem('token');
        localStorage.removeItem('selectedCharacter');
        window.location.href = '/login';
    });

    fetchCharacters();
    fetchModels();
});
