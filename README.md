# Gauntlet - Jeu 3D Multijoueur

Ce jeu est une application web 3D multijoueur en temps réel avec authentification des utilisateurs et persistance des données.

## Fonctionnalités

*   **Graphismes 3D en temps réel** avec [three.js](https://threejs.org/).
*   **Communication multijoueur** via WebSockets avec [Socket.IO](https://socket.io/).
*   **Authentification des utilisateurs** (inscription et connexion) avec JWT.
*   **Persistance des données des joueurs** (position, etc.) grâce à une base de données JSON (`lowdb`).
*   **Récupération de mot de passe** (simulation par email via la console).

## Architecture

*   **Client (Frontend)** : HTML, CSS, et JavaScript.
*   **Serveur (Backend)** : Node.js avec Express, Socket.IO, et `lowdb` pour la base de données.

## Installation et Lancement

### Prérequis

*   [Node.js](https://nodejs.org/) et npm.

### Étapes

1.  **Installer les dépendances :**
    ```bash
    cd server
    npm install
    ```

2.  **Démarrer le serveur :**
    *   Pour la production :
        ```bash
        npm start
        ```
    *   Pour le développement (avec redémarrage automatique) :
        ```bash
        npm run dev
        ```

3.  **Lancer le jeu :**
    *   Ouvrez le fichier `client/index.html` dans un navigateur web.
