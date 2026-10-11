// L'histoire du bureau : un chapitre par objet, dans l'ordre de la visite guidée.
// `say` = ce que dit Osa (la mascotte) dans sa bulle, `body` = le chapitre raconté par Yanis.

export const chapters = [
  {
    id: 'crt',
    object: 'Le vieil écran',
    era: '2021 → 2023',
    title: 'Là où tout a commencé',
    color: '#a7e8bd',
    say: "Ce vieil écran, c'est là que Yanis a écrit ses premières lignes. Des bots Discord, un serveur Minecraft… le virus était attrapé.",
    body: `
      <p>J'ai commencé comme beaucoup : pour mes potes. Un <b>bot Discord</b> avec des tickets, des suggestions, des giveaways automatiques et des commandes slash. Puis un <b>serveur Minecraft</b>, LectricMC, dont j'adaptais le launcher officiel.</p>
      <p>C'est la première fois que des gens utilisaient un truc que je maintenais. Quand ça plantait, ils me le disaient tout de suite. Ça m'a appris à corriger vite, et surtout à aimer ça.</p>`,
    chips: ['JavaScript', 'Discord.js', 'Minecraft', 'Electron'],
    links: [{ label: 'Le bot sur GitHub', url: 'https://github.com/osayanis/botdiscord' }],
  },
  {
    id: 'notebook',
    object: 'Le cahier de NSI',
    era: '2024',
    title: 'Le lycée, et le goût du « pourquoi »',
    color: '#fde68a',
    say: "Son cahier de NSI. Plein de labyrinthes en Python et de schémas griffonnés. C'est là qu'il a compris comment les choses marchent vraiment.",
    body: `
      <p>En spécialité <b>NSI</b>, j'ai découvert l'algorithmique pour de vrai : un générateur de labyrinthes en Python, des exercices sur les listes, des projets en binôme.</p>
      <p>C'est aussi l'année de mes premiers sites faits pour quelqu'un d'autre que moi. Pas encore très beaux, mais ils servaient à quelque chose. Depuis, c'est ma règle : un projet doit servir.</p>`,
    chips: ['Python', 'HTML', 'CSS', 'Algorithmique'],
    links: [],
  },
  {
    id: 'server',
    object: 'Le petit serveur',
    era: '2025',
    title: 'BTS : les mains dans le système',
    color: '#fcc48b',
    say: "Ça clignote, ça ronronne… Ce serveur, c'est son côté admin système. Il a même écrit un script pour créer des machines virtuelles à la chaîne.",
    body: `
      <p>En <b>BTS</b>, j'ai découvert l'autre côté : les serveurs, le réseau, la virtualisation. J'ai écrit un <b>script Bash pour Proxmox</b> qui crée des conteneurs et des VM en série, en vérifiant chaque réponse (RAM disponible, IP interdites…). Dix versions en deux jours.</p>
      <p>Avec mon équipe, on a aussi monté un <b>serveur d'impression</b> Debian avec CUPS, authentification et quotas. Comprendre ce qui tourne sous une app m'a rendu meilleur pour construire les apps elles-mêmes.</p>`,
    chips: ['Bash', 'Proxmox VE', 'Linux', 'CUPS', 'Réseau'],
    links: [{ label: "L'étude de cas Proxmox", url: '/projets/proxmox/', primary: true }],
  },
  {
    id: 'neon',
    object: 'Le néon OsaLabs',
    era: '2026',
    title: 'OsaLabs : quatre apps, zéro serveur au milieu',
    color: '#f3a6cf',
    say: "Et là, le néon ! OsaLabs, c'est son labo. Quatre apps web où tout passe directement d'un appareil à l'autre. Il les a sorties en une semaine.",
    body: `
      <p>Début octobre 2026, j'ai lancé <b>OsaLabs</b> : une famille d'apps en <b>pair-à-pair</b>. Tes fichiers, ton écran, ta musique ou tes dessins vont directement d'un navigateur à l'autre, via WebRTC. Aucun stockage serveur.</p>
      <p>Neuf projets lancés en huit jours, avec l'IA comme copilote pour aller vite, et beaucoup de nuits pour rendre le tout agréable.</p>`,
    widget: 'apps',
    links: [{ label: 'osalabs.fr', url: 'https://osalabs.fr' }],
  },
  {
    id: 'macbook',
    object: 'Le MacBook',
    era: 'Octobre 2026',
    title: "OsaNotch : l'encoche, enfin vivante",
    color: '#c4b5fd',
    say: "Regarde l'encoche du MacBook… c'est moi qui vis dedans ! OsaNotch, c'est son app macOS en Swift. Survole l'aperçu, tu vas voir.",
    body: `
      <p>L'encoche d'un MacBook, c'est trois centimètres de vide en plein milieu de l'écran. J'en ai fait une petite île vivante : la musique et ses <b>paroles synchronisées</b>, une étagère de fichiers, un HUD volume, un tableau de bord, et les apps OsaLabs embarquées.</p>
      <p>Un prototype en Electron le matin, une <b>réécriture complète en Swift natif</b> le soir même. 45 commits en cinq jours, 4 379 lignes de Swift.</p>`,
    widget: 'notch',
    links: [
      { label: "L'étude de cas", url: '/projets/osanotch/', primary: true },
      { label: 'Télécharger le .dmg', url: 'https://notch.osalabs.fr' },
    ],
  },
  {
    id: 'piano',
    object: 'Le piano',
    era: 'Octobre 2026',
    title: 'Clavio : apprendre le piano, une note à la fois',
    color: '#86efac',
    say: "Il a un petit Casio et aucune idée de comment s'en servir. Alors il a codé une appli façon Duolingo pour apprendre. Évidemment.",
    body: `
      <p><b>Clavio</b> se branche en USB à n'importe quel clavier MIDI. 8 unités, 28 leçons, des cœurs, des séries de jours, 16 badges… et surtout un <b>lecteur MIDI écrit à la main</b> : on importe n'importe quel morceau, et l'app nous l'apprend note par note.</p>
      <p>Zéro dépendance : 3 988 lignes de JavaScript, de CSS et de HTML purs.</p>`,
    image: { src: '/media/clavio/morceau-pas-a-pas.webp', alt: 'Clavio en mode pas à pas : les notes tombent vers le clavier' },
    links: [{ label: "L'étude de cas", url: '/projets/clavio/', primary: true }],
  },
  {
    id: 'openpod',
    object: 'Le baladeur',
    era: 'En cours',
    title: 'OpenPod : rien que la musique',
    color: '#fcc48b',
    say: "Ce baladeur n'existe pas encore vraiment… Il le construit avec un ami. Un Linux qui démarre en moins de 3 secondes, rien que pour la musique.",
    body: `
      <p>Un téléphone est un très mauvais baladeur : il sonne, il vibre, il propose autre chose. <b>OpenPod</b> veut revenir à un objet qui ne fait qu'une chose : lire la musique, avec un son <b>bit-perfect</b> et une molette tactile sous le pouce.</p>
      <p>Je développe le système : un Linux embarqué sur Raspberry Pi Zero 2 W, MPD pour l'audio, une interface 240 × 320 dessinée au pixel près. Un projet mené avec Kinam Pirrottina.</p>`,
    chips: ['Linux embarqué', 'Buildroot', 'MPD', 'I²S', 'SPI'],
    links: [{ label: "L'étude de cas", url: '/projets/openpod/', primary: true }],
  },
  {
    id: 'calendar',
    object: 'Le calendrier',
    era: 'En direct',
    title: 'Ce que je code, en ce moment',
    color: '#f3a6cf',
    say: "Son calendrier, c'est son GitHub ! Chaque case rose, c'est un jour où il a codé. Les données sont en direct.",
    body: `<p>Mes contributions, mes derniers dépôts et mon activité, tirés directement de mon profil GitHub. Rien n'est retouché.</p>`,
    widget: 'github',
    links: [{ label: 'Mon profil GitHub', url: 'https://github.com/osayanis' }],
  },
  {
    id: 'keyboard',
    object: 'Le clavier',
    era: 'Ma méthode',
    title: 'Quatre touches, dans l\'ordre',
    color: '#93c5fd',
    say: "Son clavier préféré. Il dit que tous ses projets suivent quatre touches. Appuie dessus pour voir !",
    body: `
      <ol class="method-list">
        <li><kbd>⌘</kbd><div><b>Le déclic</b><span>Presque tous mes projets partent d'un truc qui m'agace au quotidien. Si je ne m'en sers pas, je ne le construis pas.</span></div></li>
        <li><kbd>⇧</kbd><div><b>Proto rapide</b><span>Une version qui marche en quelques jours, avec l'IA comme copilote. Je la teste sur mon Mac, avec mes potes.</span></div></li>
        <li><kbd>⌥</kbd><div><b>Le détail</b><span>Ensuite seulement, les animations à ressort, les mascottes, tout ce qui rend l'outil agréable.</span></div></li>
        <li><kbd>⏎</kbd><div><b>On ship</b><span>En ligne, en .dmg ou sur un Raspberry Pi. Un projet n'existe que quand quelqu'un d'autre peut l'utiliser.</span></div></li>
      </ol>`,
    widget: 'stack',
    links: [],
  },
  {
    id: 'frame',
    object: 'Le cadre photo',
    era: 'Qui je suis',
    title: 'Bonjour, je suis Yanis',
    color: '#f9a8a8',
    say: "Et voilà le patron. Étudiant, curieux, incapable de laisser une idée dans un coin. Moi je l'aime bien.",
    body: `
      <p>Je suis étudiant en BTS, en France, et <b>je donne vie à mes idées avec l'IA</b>. J'aime les interfaces claires et les projets qui touchent au réel : un notch de MacBook, un piano MIDI, un baladeur sur Raspberry Pi, un serveur Proxmox.</p>
      <p>Mon terrain de jeu va du navigateur (WebRTC, Next.js) jusqu'au système (Swift natif, Linux embarqué, Bash).</p>`,
    stats: [['34', 'dépôts GitHub'], ['5', 'apps OsaLabs'], ['9', 'projets lancés en 8 jours']],
    links: [{ label: 'Le portfolio sur GitHub', url: 'https://github.com/osayanis/portfoliov3' }],
  },
  {
    id: 'phone',
    object: 'Le téléphone',
    era: 'Et toi ?',
    title: 'Un projet, une collab, une idée bizarre ?',
    color: '#fde68a',
    say: "Le téléphone vibre… c'est peut-être toi ? Il répond vite, surtout si c'est un projet qui sort de l'ordinaire.",
    body: `<p>Je réponds vite, surtout si c'est un projet qui sort de l'ordinaire.</p>`,
    widget: 'contact',
    links: [],
  },
]

export const byId = Object.fromEntries(chapters.map(c => [c.id, c]))
