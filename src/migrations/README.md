# Migrations — Ne pas utiliser ce dossier

**Source de vérité :** toutes les migrations à jour sont dans **`backend/migrations/`**.

```bash
cd backend && npx sequelize-cli db:migrate
```

---

## Migrations datées — dossier historique

Ce répertoire contient encore des **fichiers datés** (`20260509…`, etc.), ajoutés en parallèle de la chaîne numérotée `backend/migrations/`. **Ne pas les supprimer** sans accord (bases peut‑être déjà migrées avec cette chaîne). Pour une **nouvelle base vide**, n’utiliser que **`backend/migrations/`**.

## Ne pas ajouter de nouveaux fichiers ici

**Source de vérité pour l’équipe :** uniquement **`backend/migrations/`** (fichiers `001-…` à `019-…` et suivants).

Toute **nouvelle** migration doit être créée dans `backend/migrations/` et appliquée avec les commandes documentées à la racine du dépôt (`README.md`).

## Pourquoi ces fichiers sont encore là ?

Ils ne sont **pas supprimés** pour éviter de casser des clones ou des bases qui auraient été migrées avec cette chaîne datée. Si votre base a été créée avec **`backend/migrations/`** uniquement, ces scripts peuvent être ignorés côté exécution — en revanche, ne mélangez pas les deux chaînes sur **la même** base PostgreSQL (tables dupliquées / `SequelizeMeta` incohérent).

## Nouvelle base vide

Utiliser **uniquement** :

```bash
cd backend && npm install && npx sequelize-cli db:migrate
```

(Éventuellement `db:seed:all` — voir README racine.)

## Commandes de référence (toujours depuis `backend/`)

```bash
cd backend && npx sequelize-cli db:migrate
cd backend && npx sequelize-cli db:seed:all
cd backend && npx sequelize-cli db:migrate:undo
```

Ou depuis la racine du repo : `npm run migrate` (voir `package.json` à la racine).
