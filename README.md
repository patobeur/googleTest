# Gauntlet - Jeu 3D Multijoueur

Il s'agit d'un jeu 3D multijoueur en temps réel qui s'exécute directement dans le navigateur web.

## Architecture

Le projet est composé de deux parties principales :

*   **Client (Frontend)** : Construit avec HTML, CSS et JavaScript. Il utilise la bibliothèque [three.js](https://threejs.org/) pour le rendu des graphismes 3D.
*   **Serveur (Backend)** : Un serveur Node.js qui utilise [Socket.IO](https://socket.io/) pour la communication en temps réel (via WebSockets) entre les joueurs.

## Installation et Lancement

### Prérequis

*   Avoir [Node.js](https://nodejs.org/) et npm installés sur votre machine.

### Étapes

1.  **Installer les dépendances du serveur :**
    *   Ouvrez un terminal et naviguez dans le dossier `server`.
    *   Exécutez la commande suivante pour installer les paquets nécessaires (notamment `socket.io` qui est manquant actuellement).
    ```bash
    cd server
    npm install socket.io
    ```

2.  **Démarrer le serveur :**
    *   Toujours dans le dossier `server`, lancez le serveur avec la commande :
    ```bash
    npm start
    ```

3.  **Lancer le jeu :**
    *   Ouvrez le fichier `client/index.html` dans votre navigateur web préféré (comme Chrome, Firefox, etc.).
