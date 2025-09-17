document.addEventListener('DOMContentLoaded', () => {
    const characterListContainer = document.getElementById('character-list-container');
    const authToken = localStorage.getItem('authToken'); // Assumes token is stored in localStorage

    if (!authToken) {
        // Redirect to login page or show a message if not authenticated
        characterListContainer.innerHTML = '<p>Vous devez être connecté pour voir vos personnages. <a href="/index.html">Se connecter</a></p>';
        return;
    }

    if (!characterListContainer) {
        console.error('The character list container was not found in the DOM.');
        return;
    }

    const fetchAndDisplayCharacters = async () => {
        try {
            const response = await fetch('/api/characters/detailed', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                // Handle unauthorized access, e.g., token expired
                characterListContainer.innerHTML = '<p>Votre session a expiré. Veuillez vous reconnecter. <a href="/index.html">Se connecter</a></p>';
                localStorage.removeItem('authToken'); // Clear expired token
                return;
            }

            if (!response.ok) {
                throw new Error(`Erreur du serveur: ${response.statusText}`);
            }

            const characters = await response.json();

            if (characters.length === 0) {
                characterListContainer.innerHTML = '<p>Vous n\'avez pas encore de personnage. <a href="/index.html">Créez-en un !</a></p>';
                return;
            }

            renderCharacterCards(characters);

        } catch (error) {
            console.error('Erreur lors de la récupération des personnages:', error);
            characterListContainer.innerHTML = '<p>Une erreur est survenue lors du chargement des personnages. Veuillez réessayer plus tard.</p>';
        }
    };

    const renderCharacterCards = (characters) => {
        characterListContainer.innerHTML = ''; // Clear previous content

        characters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card';

            const inventoryListHtml = character.inventory.length > 0
                ? character.inventory.map(item => `<li>${item.item_type} <span>(x${item.quantity})</span></li>`).join('')
                : '<li>Inventaire vide</li>';

            card.innerHTML = `
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
            characterListContainer.appendChild(card);
        });
    };

    fetchAndDisplayCharacters();
});
