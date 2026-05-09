# Front Expo (React Native)

Ce dossier contient une version mobile Expo du front-end web existant.

## Demarrage

1. Installer les dependances:
   npm install
2. Lancer Expo:
   npm run start

Puis scanner le QR code avec Expo Go.

## Correspondance de structure

- `src/screens`: ecrans equivalents des pages web
- `src/components`: composants mobiles reutilisables
- `src/utils`: utilitaires metier (adaptes React Native)
- `src/locales`: traductions FR/EN reprises du front web

## Note API

Definir l URL API dans `src/api/client.js` selon votre environnement mobile (LAN, tunnel, etc.).
