# source.md — Projet Verdict

## Vue d'ensemble

**Verdict** est un jeu de débat web en HTML/CSS/JavaScript vanilla.
L'IA assigne un sujet aléatoire et un camp (POUR ou CONTRE) à chaque joueur, qui dispose de 90 secondes pour rédiger sa plaidoirie. Les réponses sont scorées par l'API Claude et versées dans un classement communautaire.

**Aucun framework. Aucun bundler. Fichiers statiques servis directement.**

---

## Stack technique

- **Frontend** : HTML5 + CSS3 + JavaScript (ES Modules natifs)
- **Base de données** : Supabase (client JS via CDN)
- **IA** : API Anthropic — modèle `claude-sonnet-4-20250514`
- **Auth** : pseudo stocké en localStorage (pas de mot de passe)
- **Déploiement** : Vercel ou GitHub Pages (fichiers statiques)

---

## Architecture des fichiers

```
verdict/
├── index.html           # Landing page — saisie du pseudo + bouton "Jouer"
├── game.html            # Page de jeu (sujet + timer + textarea)
├── results.html         # Résultats après soumission + score IA
├── leaderboard.html     # Classement du jour + réponses des autres
├── profile.html         # Profil joueur + historique
│
├── css/
│   ├── base.css         # Reset, variables CSS, typographie
│   ├── components.css   # Boutons, cards, badges, timer, toasts
│   └── pages.css        # Styles spécifiques à chaque page
│
├── js/
│   ├── config.js        # Clés API, constantes globales
│   ├── supabase.js      # Client Supabase + toutes les requêtes DB
│   ├── claude.js        # Appels API Anthropic (scoring + génération sujets)
│   ├── game.js          # Logique timer, assignation camp, validation
│   ├── game-page.js     # Script de la page game.html
│   ├── leaderboard.js   # Chargement et affichage du classement
│   ├── results.js       # Affichage des résultats
│   ├── profile.js       # Profil joueur
│   ├── index.js         # Script de la landing page
│   └── ui.js            # Helpers DOM (toasts, loaders, navigation)
│
└── source.md
```

---

## Configuration initiale

### 1. Clés API — js/config.js

Remplacer les placeholders :

```js
export const ANTHROPIC_API_KEY = 'sk-ant-VOTRE_CLE_ICI';
export const SUPABASE_URL      = 'https://xxx.supabase.co';
export const SUPABASE_ANON_KEY = 'VOTRE_CLE_SUPABASE_ICI';
```

> ⚠️ Pour ce projet scolaire, la clé Anthropic est côté client — c'est acceptable.
> En production, il faudrait un backend (ex. Vercel Serverless Function).

### 2. Schéma Supabase — coller dans l'éditeur SQL

```sql
create table subjects (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  category    text check (category in ('absurde', 'societal', 'philosophique')),
  active_date date unique,
  created_at  timestamptz default now()
);

create table players (
  id           uuid primary key default gen_random_uuid(),
  username     text unique not null,
  total_score  integer default 0,
  games_played integer default 0,
  created_at   timestamptz default now()
);

create table responses (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid references players(id),
  subject_id        uuid references subjects(id),
  camp              text not null check (camp in ('POUR', 'CONTRE')),
  content           text not null,
  score_total       integer,
  score_conviction  integer,
  score_arguments   integer,
  score_originality integer,
  score_style       integer,
  ai_verdict        text,
  created_at        timestamptz default now(),
  unique(player_id, subject_id)
);

create or replace function increment_player_score(p_id uuid, points integer)
returns void language sql as $$
  update players
  set total_score  = total_score + points,
      games_played = games_played + 1
  where id = p_id;
$$;
```

### 3. Sujet du jour

Insérer un sujet dans la table `subjects` avec `active_date = today` :

```sql
insert into subjects (text, category, active_date)
values ('Les chats sont supérieurs aux chiens', 'absurde', current_date);
```

---

## Lancer en local

Utiliser un serveur HTTP (ES Modules ne fonctionnent pas en `file://`) :

```bash
npx serve .
# ou
python3 -m http.server 8080
```

## Déploiement

GitHub Pages : pousser sur `main`, activer Pages depuis les Settings.  
Vercel : `vercel --prod` depuis le dossier racine.
