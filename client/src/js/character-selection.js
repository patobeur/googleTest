// client/character-selection.js

let onPlayCallback = null;
let authToken = null;
let selectedCharacter = null;

let characterSelectionContainer, characterList, playButton, authContainer, gameContainer;

function renderCharacters(characters) {
	characterList.innerHTML = "";
	characters.forEach((character) => {
		const characterCard = document.createElement("div");
		characterCard.className = "character-card";
		characterCard.dataset.characterId = character.id;
		characterCard.innerHTML = `
            <h3>${character.name}</h3>
            <p>Level: ${character.level}</p>
        `;
		characterCard.addEventListener("click", () => {
			if (selectedCharacter) {
				const selectedCard = document.querySelector(".character-card.selected");
				if (selectedCard) {
					selectedCard.classList.remove("selected");
				}
			}
			selectedCharacter = character;
			characterCard.classList.add("selected");
			playButton.disabled = false;
		});
		characterList.appendChild(characterCard);
	});
}

function show(token) {
	authToken = token;
	authContainer.style.display = "none";
	gameContainer.style.display = "none";
	characterSelectionContainer.style.display = "block";

	// Mock character data for now, as requested
	const mockCharacters = [
		{ id: "char1", name: "Default Hero", level: 1 },
	];
	renderCharacters(mockCharacters);
}

function hide() {
    characterSelectionContainer.style.display = "none";
}

function init(playCallback) {
	onPlayCallback = playCallback;

    characterSelectionContainer = document.getElementById("character-selection-container");
    characterList = document.getElementById("character-list");
    playButton = document.getElementById("play-button");
    authContainer = document.getElementById("auth-container");
    gameContainer = document.getElementById("game-container");

	playButton.addEventListener("click", () => {
		if (selectedCharacter && onPlayCallback) {
            hide();
			// Pass the token and selected character info to the game initialization function
			onPlayCallback(authToken, selectedCharacter);
		}
	});
}

export const CharacterSelection = {
	init,
	show,
    hide
};
