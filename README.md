# Mini-RPG 3D Multijoueur

Ce projet est le prototype d'un mini-jeu de rôle (RPG) 3D multijoueur, jouable en réseau local. Il sert de base à une vision plus large : créer un outil pédagogique permettant de construire des environnements virtuels ludiques et collaboratifs pour les écoles.

## Vision du Projet

L'ambition à long terme est de transformer ce jeu en une plateforme où des enseignants pourraient créer des mondes 3D persistants. Les élèves pourraient s'y connecter, interagir avec l'environnement et entre eux, et participer à des activités pédagogiques immersives. 

## Fonctionnalités Actuelles

*   **Graphismes 3D en temps réel** avec [three.js](https://threejs.org/).
*   **Communication multijoueur** via WebSockets avec [Socket.IO](https://socket.io/).
*   **Authentification des utilisateurs** (inscription et connexion) avec JWT.
*   **Persistance des données des joueurs** (position, etc.) grâce à une base de données JSON (`lowdb`).
*   **Déplacement des personnages** et synchronisation entre les joueurs.

## Architecture

*   **Client (Frontend)** : HTML, CSS, et JavaScript vanilla.
    *   La 3D est gérée par la bibliothèque `three.js`.
*   **Serveur (Backend)** : Node.js avec Express.
    *   La communication temps réel est assurée par `Socket.IO`.
    *   La base de données est un simple fichier JSON géré par `lowdb`.

## Installation et Lancement

### Prérequis

*   [Node.js](https://nodejs.org/) et npm.

### Étapes

1.  **Installer les dépendances du serveur :**
    ```bash
    cd server
    npm install
    ```

2.  **Démarrer le serveur :**
    *   Pour la production :
        ```bash
        npm start
        ```
    *   Pour le développement (avec redémarrage automatique en cas de modification) :
        ```bash
        npm run dev
        ```
    Le serveur démarrera par défaut sur le port 3000.

3.  **Lancer le jeu :**
    *   Ouvrez simplement le fichier `client/index.html` dans votre navigateur web. Pas besoin de serveur web, tout est géré côté client.

# ROADMAP

## Objectifs Futurs phase 1

 -[x] Pop et repop de ressources collectables.

## Objectifs Futurs phase 2

 -[x] **Système d'inventaire** et de collecte de ressources.

 -[ ] Systeme de déplacement des items dans l'inventaire d'une case à une autre vide.

 -[ ] Systeme pour déposer des items au sol.

## Objectifs Futurs phase 3

-[ ] Le personnage doit utiliser le model indiqué lors de sa creation.

-[ ] le nom du personnage doit etre le nom donnée au personnage et non le mail du compte.

## Objectifs Futurs phase inconnu

*   **Interactions avec l'environnement** (PNJ, objets, quêtes).
*   **Interactions entre joueurs/euses** (PNJ, objets, quêtes).
