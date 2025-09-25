# Roadmap du Mini-RPG 3D

Ce document décrit les prochaines étapes de développement du projet, organisées en phases pour garantir une progression logique et maintenir la stabilité de l'application. Chaque fonctionnalité majeure sera développée dans une branche dédiée.

## Phase 1 : Améliorations de l'Expérience de Base

Cette phase se concentre sur les fonctionnalités essentielles pour rendre le jeu plus complet et personnalisé.

-  **Tâche :** Améliorer la gestion de l'inventaire.

   -  **Description :** Permettre aux joueurs de déplacer des objets entre les cases de leur inventaire.
   -  **Branche suggérée :** `feature/inventory-drag-drop`

-  **Tâche :** Permettre de déposer des objets au sol.

   -  **Description :** Ajouter la fonctionnalité pour qu'un joueur puisse retirer un objet de son inventaire et le faire apparaître dans le monde du jeu.
   -  **Branche suggérée :** `feature/drop-items`

-  **Tâche :** Personnalisation du personnage.
   -  **Description :** Le modèle 3D du personnage doit correspondre à celui choisi lors de la création du compte. Le nom affiché en jeu doit être le nom du personnage et non l'email du joueur.
   -  **Branche suggérée :** `feature/character-customization`

---

## Phase 2 : Moteur Physique et Interactions Réalistes

Cette phase est cruciale et a pour but d'ajouter de la profondeur au gameplay en simulant un monde plus réaliste. Elle sera décomposée en plusieurs sous-tâches pour maîtriser la complexité.

-  **Tâche :** Intégration d'un moteur physique.

   -  **Description :** Choisir et intégrer une bibliothèque de physique côté client (par exemple, `Ammo.js existe dans node_modules_min`) pour gérer les collisions et la gravité. Le serveur devra être adapté pour valider les positions.
   -  **Branche suggérée :** `feature/physics-engine`

-  **Tâche :** Gravité et collisions pour les objets du monde.

   -  **Description :** Une fois le moteur physique en place, appliquer la gravité aux objets qui sont déposés au sol. Ils devront entrer en collision avec le décor et ne pas passer à travers.
   -  **Branche suggérée :** `feature/world-object-physics`
   -  **Dépendance :** `feature/physics-engine`

## Phase 3 : Moteur Physique et Interactions Réalistes entre objets et joueur.

-  **Tâche :** Gravité et collisions pour les joueurs.

   -  **Description :** Appliquer la gravité et les collisions au personnage du joueur. Le joueur ne devrait plus pouvoir traverser les murs ou les objets du décor. Attention les animations du model (du joueur) des ses rotations et la camera doivent etre respecté. il faut penser à faire attention si le model est dans un groupe ou si la camera est dans un groupe ou autre mesh.
   -  **Branche suggérée :** `feature/player-physics`
   -  **Dépendance :** `feature/physics-engine`

## Phase 4 : Moteur Physique et Interactions Réalistes entre objets et joueur.

-  **Tâche :** Gestion des collisions entre joueurs.
   -  **Description :** Implémenter la détection de collision entre les joueurs. Ajouter une option (côté serveur ou client) pour permettre aux joueurs de se traverser ou non.
   -  **Branche suggérée :** `feature/player-collision-toggle`
   -  **Dépendance :** `feature/player-physics`

---

## Phase 5 : Enrichissement du Monde (Vision à long Terme)

Une fois le gameplay de base solide, nous pourrons nous concentrer sur l'ajout de contenu et d'interactions plus riches.

-  **Tâche :** Interactions avec l'environnement.

   -  **Description :** Ajouter des Personnages Non-Joueurs (PNJ) avec des dialogues simples, des objets interactifs (leviers, portes) et un système de quêtes basique.
   -  **Branche suggérée :** `feature/world-interactions`

-  **Tâche :** Interactions entre joueurs.
   -  **Description :** Développer des fonctionnalités d'interaction directe entre les joueurs, comme l'échange d'objets.
   -  **Branche suggérée :** `feature/player-interactions`

---

## Vision à très Long Terme

-  **Outil de création d'environnements :** Développer une interface pour que les non-développeurs (enseignants) puissent construire et personnaliser leurs propres mondes.
-  **Persistance avancée :** Migrer de `lowdb` vers une base de données plus robuste (comme MongoDB ou PostgreSQL) pour gérer un plus grand nombre de joueurs et de données.
-  **Optimisation des performances :** Améliorer les performances du client et du serveur pour supporter des mondes plus grands et plus de joueurs simultanément.
