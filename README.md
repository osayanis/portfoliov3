# yanis. · portfolio

Un portfolio en forme de clavier mécanique : chaque touche de **PORT / FOLIO** mène à une section, le vrai clavier fait bouger les touches, et taper `PORTFOLIO` déclenche une surprise.

Vite + JavaScript vanilla, aucune dépendance au runtime. Les sons sont synthétisés en WebAudio.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # génère dist/
```

## Modifier le contenu

Tout le texte « données » est dans `src/data.js` : touches du hero, apps OsaLabs, stack, parcours, méthode et liens de contact.
Mets ton adresse dans `profile.email` pour que le bouton « Écris-moi » ouvre un mail (sinon il pointe vers GitHub).

## Sections

| Touche | Section |
|---|---|
| P | OsaNotch, avec un notch animé (musique / fichiers / IA) et la mascotte qui suit le curseur |
| O | L'écosystème OsaLabs : OsaParty, OsaDrop, OsaCast, OsaBoard |
| F | GitHub en direct : contributions, derniers dépôts, langages, activité |
| L | Le labo : Clavio (mini piano jouable), OpenPod OS, script Proxmox |
| O | À propos |
| I | Méthode |
| T | Stack (les touches cliquent) |
| R | Parcours |
| ⏎ | Contact |

## Études de cas

Chaque projet a sa page : `/projets/<slug>/` (OsaNotch, OsaParty, OsaDrop, OsaCast, OsaBoard, Clavio, OpenPod OS, Proxmox).

- Le contenu est dans `src/projects.js` : textes, chiffres, schéma d'architecture, journal de bord, défis.
- `scripts/build-pages.mjs` génère le HTML statique dans `projets/` (lancé par `npm run dev` et `npm run build`, ou à la main avec `npm run pages`).
- Chaque page a une démo interactive, chargée à la demande depuis `src/demos/`.
- Les captures sont dans `public/media/<slug>/`.

## Section GitHub

Elle charge les données en direct dans le navigateur (API GitHub publique + `github-contributions-api.jogruber.de` pour le graphe), avec un cache de 15 min.
Si l'API ne répond pas (limite de 60 requêtes/heure par visiteur), le site affiche `src/github-snapshot.json`.
Cet instantané est régénéré à chaque `npm run build`, ou à la main avec `npm run snapshot`.

## Déployer

Sur Vercel : importe le dossier, preset **Vite**, sortie `dist`.
