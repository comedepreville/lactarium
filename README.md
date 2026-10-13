# Lactae

PWA de suivi des tirages de lait — cible **800 ml / 24 h**, espacement max 6 h le jour / 5 h la nuit.

Prod : [https://lactae.app](https://lactae.app)

## Fonctionnalités

- **Comptes** : authentification e-mail / mot de passe via Supabase
- **Onboarding** : prénom parent, prénom et date de naissance de l’enfant
- **Accueil** : dashboard du jour (volume 24 h, tirages restants, délai avant prochain tirage) + 3 derniers jours
- **Ajouter / modifier** un tirage (heure Paris par pas de 10 min, quantité par pas de 10 ml)
- **Calendrier** : historique complet avec édition
- **Journal de vie** : fil d’événements groupés par jour
- **Backend** : Supabase (Auth + Postgres + RLS)
- **PWA** : installable, mode autonome

## Démarrage local

```bash
cp .env.example .env
# Renseigner NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# et SUPABASE_SERVICE_ROLE_KEY (admin / création soignants)
npm install
npm run dev
```

Ouvre [http://localhost:3847](http://localhost:3847).

Dans Supabase → Authentication → URL configuration, ajoutez aux Redirect URLs :
- `http://localhost:3847/auth/callback`
- `https://lactae.app/auth/callback`
- `https://www.lactae.app/auth/callback` (si www)

Pour promouvoir un compte admin :
```sql
update public.profiles set user_type = 'admin' where id = '<uuid>';
```

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
