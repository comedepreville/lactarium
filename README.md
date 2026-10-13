# Lactae

PWA de suivi des tirages de lait — cible **800 ml / 24 h**, espacement max 6 h le jour / 5 h la nuit.

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
# Renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
```

Ouvre [http://localhost:3847](http://localhost:3847).

Dans Supabase → Authentication → URL configuration, ajoutez `http://localhost:3847/auth/callback` aux Redirect URLs.

## Déploiement Docker Compose (Traefik)

```bash
cp .env.example .env
# LACTARIUM_HOST + variables Supabase
docker compose up -d --build
```

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui · Supabase · date-fns (Europe/Paris)
