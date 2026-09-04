# Yazaki TMS Backend

L'API serveur pour Yazaki TMS. Construite avec Node.js, Express, et PostgreSQL.

## Démarrage Rapide

1. Copiez `.env.example` vers `.env` (si non existant) et configurez la base de données.
2. Lancez `npm install`.
3. Lancez le serveur avec `npm run dev` (défaut sur le port 5001).

## Fonctionnalités
- Gestion des utilisateurs et administrateurs.
- Suivi des bus, opérateurs, stations et shifts.
- Authentification et validation de sécurité des mots de passe.
- Envoi automatique des mots de passe par e-mail.
