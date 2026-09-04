# Yazaki Transport Management System (TMS)

Yazaki TMS est une application web professionnelle conçue pour la gestion et le suivi en temps réel du transport des opérateurs de Yazaki. Elle permet d'analyser les retards, de gérer les affectations (shifts, stations, bus) et d'administrer les accès via un tableau de bord moderne et sécurisé.

## Structure du Projet

Ce projet est organisé sous forme de monorepo contenant deux dossiers principaux :

- `/frontend` : L'interface utilisateur construite avec React et Vite (Design Glassmorphism YAZAKI).
- `/backend`  : L'API serveur construite avec Node.js, Express et PostgreSQL pour la gestion des données et l'authentification.

## Prérequis

- **Node.js** (v18 ou supérieur)
- **PostgreSQL** (base de données)
- **npm** ou **yarn**

## Démarrage Rapide

### 1. Configuration du Backend
1. Naviguez dans le dossier `backend` : `cd backend`
2. Installez les dépendances : `npm install`
3. Configurez vos variables d'environnement dans `backend/.env` (DB_USER, DB_PASS, MAIL_USER, MAIL_PASS, etc.).
4. Démarrez le serveur : `npm run dev` (le serveur démarrera sur `http://localhost:5001`).

### 2. Configuration du Frontend
1. Ouvrez un nouveau terminal et naviguez dans le dossier `frontend` : `cd frontend`
2. Installez les dépendances : `npm install`
3. Démarrez l'application : `npm run dev` (le frontend démarrera sur `http://localhost:5173`).

## Fonctionnalités Principales

- **Tableau de Bord Global** : Vue d'ensemble des statistiques de transport et KPI.
- **Gestion des Retards** : Suivi des pointages avec calcul automatique des retards et filtre de sévérité.
- **Ressources** : Gestion des Opérateurs, Bus, Stations et Shifts.
- **Sécurité et Rôles** : Accès différencié (Admin vs Super Admin), mots de passe temporaires, validation stricte de la sécurité des mots de passe.
- **Notifications** : Système d'envoi d'emails via Nodemailer.

---
*Projet PFE 2026 - Yazaki*