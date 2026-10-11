# yanis. · le bureau

Un portfolio qu'on parcourt au lieu de le faire défiler : **le bureau de Yanis**, une pièce en 3D (Three.js) où chaque objet raconte un chapitre de son parcours. Osa, la mascotte, sert de guide.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # génère dist/
```

## Le bureau

| Objet | Chapitre |
|---|---|
| Le vieil écran | 2021 → 2023 : les débuts (bot Discord, serveur Minecraft) |
| Le cahier de NSI | 2024 : le lycée |
| Le petit serveur | 2025 : BTS, Proxmox |
| Le néon OsaLabs | 2026 : OsaParty, OsaDrop, OsaCast, OsaBoard |
| Le MacBook | OsaNotch (avec l'aperçu interactif du notch) |
| Le piano | Clavio |
| Le baladeur | OpenPod OS |
| Le calendrier | GitHub en direct |
| Le clavier | Méthode et boîte à outils |
| Le cadre photo | À propos |
| Le téléphone | Contact |

- La pièce 3D : `src/room/scene.js`. Les textes des chapitres : `src/room/chapters.js`. L'interface : `src/main.js` et `src/room/room.css`.
- Navigation : glisser pour tourner, clic sur un objet, flèches ← → pour passer d'un chapitre à l'autre, `T` visite guidée, `C` carnet, `L` lumière, `Échap` pour fermer.
- Liens directs : `/#osanotch`, `/#github`, `/#contact`… ouvrent l'objet correspondant.
- L'interrupteur « lumière » passe la pièce de la nuit au jour (le site est de nuit par défaut).
- Le **carnet** reprend toute l'histoire en texte : il sert de version sans 3D et de contenu pour les moteurs de recherche.
- Mets ton adresse dans `profile.email` (`src/data.js`) pour que « Écris-moi » ouvre un mail (sinon il pointe vers GitHub).

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
