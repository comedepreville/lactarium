# Lactae

PWA de suivi des tirages de lait — cible **800 ml / 24 h**, espacement max 6 h le jour / 5 h la nuit.

Prod : [https://lactae.app](https://lactae.app)

## Fonctionnalités

- **Comptes** : authentification e-mail / mot de passe via Supabase
- **Onboarding** : prénom parent, date de début de tirage de lait
- **Profil** : nom, date de début de tirage, objectif ml/24 h, mot de passe, notifications, export CSV, suppression de compte
- **Accueil** : dashboard du jour (volume 24 h, tirages restants, délai avant prochain tirage) + 3 derniers jours
- **Ajouter / modifier** un tirage (heure Paris par pas de 10 min, quantité par pas de 10 ml)
- **Calendrier** : historique complet avec édition
- **Journal de vie** : fil d’événements groupés par jour
- **Backend** : Supabase (Auth + Postgres + RLS)
- **PWA** : installable ; le service worker ne met en cache que les assets statiques (jamais HTML/RSC avec données utilisateur)
- **Notifications push** : rappel 10 min avant l’échéance « prochain tirage », et « Tirage fini ! » à la fin du minuteur (iOS 16.4+ en web app écran d’accueil, Android Chrome)
- **Infos légales** : page unique `/infos-legales` (mentions, données, conservation)
- **Rétention** : tirages / journal effacés après 2 ans ; comptes inactifs 2 ans supprimés automatiquement

## Démarrage local

```bash
cp .env.example .env
# Renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# Pour les push : SUPABASE_SERVICE_ROLE_KEY + clés VAPID
#   npx web-push generate-vapid-keys
npm install
npm run dev
```

### Notifications push

1. Appliquer la migration `supabase/migrations/20261015190000_push_notifications.sql`
2. Générer des clés VAPID (`npx web-push generate-vapid-keys`) et les mettre dans `.env`
3. Ajouter `SUPABASE_SERVICE_ROLE_KEY` (envoi serveur des notifs planifiées)
4. Rebuild Docker si besoin (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` est injecté au build)

Le serveur poll toutes les 30 s les notifs dues. Endpoint manuel : `POST /api/cron/push` avec `Authorization: Bearer $CRON_SECRET`.

### Rétention des données (2 ans)

1. Appliquer la migration `supabase/migrations/20261023180000_data_retention_2y.sql` (fonction RPC `purge_data_older_than_retention`)
2. Le serveur exécute une purge une fois par jour au démarrage / toutes les 24 h (nécessite `SUPABASE_SERVICE_ROLE_KEY`)
3. Endpoint manuel : `POST /api/cron/retention` avec `Authorization: Bearer $CRON_SECRET`

Sur iPhone : installer Lactae via « Sur l’écran d’accueil », ouvrir l’icône, puis activer les notifications depuis l’accueil.

Ouvre [http://localhost:3847](http://localhost:3847).

Dans Supabase → Authentication → URL configuration, ajoutez aux Redirect URLs :
- `http://localhost:3847/auth/callback`
- `https://lactae.app/auth/callback`
- `https://www.lactae.app/auth/callback` (si utilisé)

## Déploiement Docker Compose (Traefik)

Prérequis VPS : Traefik déjà en place + réseau Docker `common_network` (comme tes autres projets).

### DNS (`lactae.app`)

Chez Hostinger, pointe le domaine vers le VPS :

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | `@` | `168.231.86.40` | 300 (puis remonter) |
| CNAME | `www` | `lactae.app.` | 300 |

Supprime / remplace l’ancien A `@ → 2.57.91.91` (parking Hostinger). Les NS Hostinger peuvent rester tels quels.

### Docker

```bash
cp .env.example .env
# LACTARIUM_HOST=lactae.app (déjà dans .env.example)
# + variables Supabase
docker compose up -d --build
```

Sur le VPS, mets à jour le `.env` existant (`LACTARIUM_HOST=lactae.app` + clés Supabase) puis rebuild.

Traefik route `lactae.app` et `www.lactae.app` vers le conteneur (port interne `3000`) et demande le certificat Let’s Encrypt.

### Arrêt

```bash
docker compose down
```

## Dev local (sans Traefik)

```bash
npm run dev   # http://localhost:3847
```

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui · Supabase · date-fns (Europe/Paris)
