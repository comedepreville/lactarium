# Lactarium

PWA de suivi des tirages de lait — cible **800 ml / 24 h**, espacement max 6 h le jour / 5 h la nuit.

## Fonctionnalités

- **Accueil** : dashboard du jour (volume 24 h, tirages restants, délai avant prochain tirage) + 3 derniers jours
- **Ajouter / modifier** un tirage (heure Paris par pas de 10 min, quantité par pas de 10 ml)
- **Calendrier** : historique complet avec édition
- **Backend** : Google Sheets si configuré, sinon JSON local
- **PWA** : installable, mode autonome

## Démarrage local

```bash
cp .env.example .env
npm install
npm run dev
```

Ouvre [http://localhost:3847](http://localhost:3847).

## Déploiement Docker Compose (Traefik)

Prérequis VPS : Traefik déjà en place + réseau Docker `common_network` (comme tes autres projets).

```bash
cp .env.example .env
# Renseigner LACTARIUM_HOST=ton-domaine.fr
# optionnel : GOOGLE_SHEETS_*
docker compose up -d --build
```

Traefik route le domaine vers le conteneur (port interne `3000`).  
Les données locales sont persistées dans le volume Docker `lactarium-data`.

### Arrêt

```bash
docker compose down
```

## Dev local (sans Traefik)

```bash
npm run dev   # http://localhost:3847
```

## Google Sheets

1. Activer **Google Sheets API** sur un projet Cloud
2. Créer un **compte de service** et télécharger la clé JSON
3. Créer une feuille Google, la partager en **Éditeur** avec l’email du compte de service
4. Renseigner dans `.env` :
   - `GOOGLE_SHEETS_ID` (ID dans l’URL de la sheet)
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (avec `\n` pour les retours à la ligne)

Au premier accès, Lactarium crée l’onglet `Tirages` avec les colonnes `id | datetime | quantityMl`.

Sans ces variables, l’app écrit dans `data/tirages.json` (ou `/data` en Docker).

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui · date-fns (Europe/Paris)
