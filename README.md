# yanis. · le bureau

Un portfolio qu'on parcourt au lieu de le faire défiler : **le bureau de Yanis**, une pièce chaleureuse en 3D (Three.js) qui occupe tout l'écran. Un grand bureau en bois au centre, une baie vitrée sur la ville derrière, et chaque objet raconte un chapitre du parcours. Osa, la mascotte, sert de guide ; le chat dort sur la banquette.

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
| La tablette | OsaWallpaper (l'écran verrouillé, avec l'heure en direct) |
| Le piano | Clavio |
| Le baladeur | OpenPod OS |
| Le calendrier | GitHub en direct |
| Le clavier | Méthode et boîte à outils |
| Le cadre photo | À propos |
| Le téléphone | Contact |

On entre par un mot d'accueil, puis la caméra glisse jusqu'au bureau.

Et hors parcours : la **discothèque** sous le portrait contient les morceaux préférés de Yanis. On en choisit un, il sort de sa case, le disque glisse hors de la pochette, et on peut le poser sur le **tourne-disque**. La platine, vue de dessus, joue l'extrait officiel de 30 s fourni par Apple Music (API iTunes), avec la pochette sur le macaron et un lien pour écouter en entier. Aucun fichier audio n'est hébergé ; la liste des disques est dans `src/room/records.js`. Le **chat** sur la banquette a quelques répliques.

La vue derrière la baie vitrée est une vidéo en boucle de [Mixkit](https://mixkit.co/free-stock-video/new-york-buildings-at-night-4334/) (licence Mixkit Stock Video Free).

- La pièce 3D : `src/room/scene.js`. Les textes des chapitres : `src/room/chapters.js`. L'interface : `src/main.js` et `src/room/room.css`.
- Navigation : glisser pour tourner, clic sur un objet, flèches ← → pour passer d'un chapitre à l'autre, `T` visite guidée, `C` carnet, `Échap` pour fermer.
- Liens directs : `/#osanotch`, `/#github`, `/#contact`… ouvrent l'objet correspondant.
- Le site est toujours de nuit : lumière tamisée, feu de cheminée, ville éclairée derrière la baie.
- Le **carnet** reprend toute l'histoire en texte : il sert de version sans 3D et de contenu pour les moteurs de recherche.
- Mets ton adresse dans `profile.email` (`src/data.js`) pour que « Écris-moi » ouvre un mail (sinon il pointe vers GitHub).

## Études de cas

Chaque étude de cas s'ouvre sur une image du bureau cadrée sur l'objet du projet. Ces images (`public/media/bureau/`) se régénèrent avec le mode prise de vue : `/?shot=macbook`, `/?shot=piano`…


Chaque projet a sa page : `/projets/<slug>/` (OsaNotch, OsaWallpaper, OsaParty, OsaDrop, OsaCast, OsaBoard, Clavio, OpenPod OS, Proxmox).

- Le contenu est dans `src/projects.js` : textes, chiffres, schéma d'architecture, journal de bord, défis.
- `scripts/build-pages.mjs` génère le HTML statique dans `projets/` (lancé par `npm run dev` et `npm run build`, ou à la main avec `npm run pages`).
- Chaque page a une démo interactive, chargée à la demande depuis `src/demos/`.
- Les captures sont dans `public/media/<slug>/`. Les photos d'OsaWallpaper viennent de Wallhaven (photographes crédités sur la page).

## Section GitHub

Elle charge les données en direct dans le navigateur (API GitHub publique + `github-contributions-api.jogruber.de` pour le graphe), avec un cache de 15 min.
Si l'API ne répond pas (limite de 60 requêtes/heure par visiteur), le site affiche `src/github-snapshot.json`.
Cet instantané est régénéré à chaque `npm run build`, ou à la main avec `npm run snapshot`.

## Déployer

Sur Vercel : importe le dossier, preset **Vite**, sortie `dist`.
